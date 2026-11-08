const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DecentraCertRegistry Smart Contract", function () {
  let registry;
  let admin;
  let issuer;
  let unauthorized;

  // Realistic SHA-256 test hashes (32 bytes)
  const sampleHash1 = ethers.keccak256(ethers.toUtf8Bytes("DEC-CERT-2026-TEST-PDF-BYTES-1"));
  const sampleHash2 = ethers.keccak256(ethers.toUtf8Bytes("DEC-CERT-2026-TEST-PDF-BYTES-2"));
  const zeroHash = ethers.ZeroHash;

  beforeEach(async function () {
    [admin, issuer, unauthorized] = await ethers.getSigners();

    const DecentraCertRegistryFactory = await ethers.getContractFactory("DecentraCertRegistry");
    registry = await DecentraCertRegistryFactory.deploy(admin.address);
    await registry.waitForDeployment();

    // Grant ISSUER_ROLE to designated issuer
    const ISSUER_ROLE = await registry.ISSUER_ROLE();
    await registry.connect(admin).grantRole(ISSUER_ROLE, issuer.address);
  });

  describe("1. Deployment & Access Control", function () {
    it("Should assign DEFAULT_ADMIN_ROLE and ISSUER_ROLE to initial admin", async function () {
      const DEFAULT_ADMIN_ROLE = await registry.DEFAULT_ADMIN_ROLE();
      const ISSUER_ROLE = await registry.ISSUER_ROLE();

      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await registry.hasRole(ISSUER_ROLE, admin.address)).to.be.true;
    });

    it("Should allow admin to grant and revoke ISSUER_ROLE", async function () {
      const ISSUER_ROLE = await registry.ISSUER_ROLE();
      expect(await registry.hasRole(ISSUER_ROLE, issuer.address)).to.be.true;

      await registry.connect(admin).revokeRole(ISSUER_ROLE, issuer.address);
      expect(await registry.hasRole(ISSUER_ROLE, issuer.address)).to.be.false;
    });

    it("Should prevent unauthorized accounts from granting roles", async function () {
      const ISSUER_ROLE = await registry.ISSUER_ROLE();
      await expect(
        registry.connect(unauthorized).grantRole(ISSUER_ROLE, unauthorized.address)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("2. Certificate Issuance", function () {
    it("Should allow an authorized issuer to anchor a certificate hash", async function () {
      const tx = await registry.connect(issuer).issueCertificate(sampleHash1);
      const receipt = await tx.wait();

      expect(receipt).to.not.be.null;

      // Verify CertificateIssued event
      await expect(tx)
        .to.emit(registry, "CertificateIssued")
        .withArgs(sampleHash1, issuer.address, (await ethers.provider.getBlock("latest")).timestamp);

      expect(await registry.totalIssued()).to.equal(1n);

      // Verify stored details
      const details = await registry.getCertificateDetails(sampleHash1);
      expect(details.certificateHash).to.equal(sampleHash1);
      expect(details.issuer).to.equal(issuer.address);
      expect(details.revoked).to.be.false;
      expect(details.issuedAt).to.be.gt(0);
    });

    it("Should prevent unauthorized accounts from issuing certificates", async function () {
      await expect(
        registry.connect(unauthorized).issueCertificate(sampleHash1)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("Should reject zero-hash certificate issuance", async function () {
      await expect(
        registry.connect(issuer).issueCertificate(zeroHash)
      ).to.be.revertedWithCustomError(registry, "ZeroHashNotAllowed");
    });

    it("Should prevent issuing duplicate certificate hashes", async function () {
      await registry.connect(issuer).issueCertificate(sampleHash1);

      await expect(
        registry.connect(issuer).issueCertificate(sampleHash1)
      ).to.be.revertedWithCustomError(registry, "CertificateAlreadyExists").withArgs(sampleHash1);
    });
  });

  describe("3. Certificate Verification View", function () {
    it("Should return correct state for unissued certificate", async function () {
      const [exists, isValid, isRevoked, issuerAddr, issuedAt] = await registry.verifyCertificate(sampleHash2);
      expect(exists).to.be.false;
      expect(isValid).to.be.false;
      expect(isRevoked).to.be.false;
      expect(issuerAddr).to.equal(ethers.ZeroAddress);
      expect(issuedAt).to.equal(0n);
    });

    it("Should return valid state for active issued certificate", async function () {
      await registry.connect(issuer).issueCertificate(sampleHash1);

      const [exists, isValid, isRevoked, issuerAddr, issuedAt] = await registry.verifyCertificate(sampleHash1);
      expect(exists).to.be.true;
      expect(isValid).to.be.true;
      expect(isRevoked).to.be.false;
      expect(issuerAddr).to.equal(issuer.address);
      expect(issuedAt).to.be.gt(0);
    });
  });

  describe("4. Certificate Revocation", function () {
    const revocationReason = "Academic credential annulled due to disciplinary proceedings.";

    beforeEach(async function () {
      await registry.connect(issuer).issueCertificate(sampleHash1);
    });

    it("Should allow administrator to revoke a certificate with a reason", async function () {
      const tx = await registry.connect(admin).revokeCertificate(sampleHash1, revocationReason);
      const receipt = await tx.wait();

      expect(receipt).to.not.be.null;

      await expect(tx)
        .to.emit(registry, "CertificateRevoked")
        .withArgs(
          sampleHash1,
          admin.address,
          revocationReason,
          (await ethers.provider.getBlock("latest")).timestamp
        );

      expect(await registry.totalRevoked()).to.equal(1n);

      // Check verifyCertificate returns valid=false, revoked=true
      const [exists, isValid, isRevoked] = await registry.verifyCertificate(sampleHash1);
      expect(exists).to.be.true;
      expect(isValid).to.be.false;
      expect(isRevoked).to.be.true;

      expect(await registry.isCertificateRevoked(sampleHash1)).to.be.true;

      const details = await registry.getCertificateDetails(sampleHash1);
      expect(details.revoked).to.be.true;
      expect(details.revocationReason).to.equal(revocationReason);
      expect(details.revokedAt).to.be.gt(0);
    });

    it("Should prevent non-admin from revoking certificates", async function () {
      await expect(
        registry.connect(unauthorized).revokeCertificate(sampleHash1, revocationReason)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("Should reject revocation without a reason", async function () {
      await expect(
        registry.connect(admin).revokeCertificate(sampleHash1, "")
      ).to.be.revertedWithCustomError(registry, "EmptyRevocationReason");
    });

    it("Should reject revoking an unissued certificate", async function () {
      await expect(
        registry.connect(admin).revokeCertificate(sampleHash2, revocationReason)
      ).to.be.revertedWithCustomError(registry, "CertificateDoesNotExist").withArgs(sampleHash2);
    });

    it("Should reject re-revoking an already revoked certificate", async function () {
      await registry.connect(admin).revokeCertificate(sampleHash1, revocationReason);

      await expect(
        registry.connect(admin).revokeCertificate(sampleHash1, "Second attempt")
      ).to.be.revertedWithCustomError(registry, "CertificateAlreadyRevoked").withArgs(sampleHash1);
    });
  });
});

// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DecentraCertRegistry
 * @notice Immutable, tamper-evident registry for academic credentials and digital certificates.
 * @dev Anchors SHA-256 certificate hashes (stored as bytes32) to the Ethereum blockchain.
 *      Supports multi-role authorization via OpenZeppelin AccessControl.
 */
contract DecentraCertRegistry is AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct CertificateRecord {
        bytes32 certificateHash;
        address issuer;
        uint256 issuedAt;
        bool revoked;
        uint256 revokedAt;
        string revocationReason;
    }

    // Mapping from SHA-256 certificate hash (bytes32) to on-chain record
    mapping(bytes32 => CertificateRecord) private _certificates;

    // Track total counts for transparency
    uint256 public totalIssued;
    uint256 public totalRevoked;

    // Events
    event CertificateIssued(
        bytes32 indexed certificateHash,
        address indexed issuer,
        uint256 timestamp
    );

    event CertificateRevoked(
        bytes32 indexed certificateHash,
        address indexed revokedBy,
        string reason,
        uint256 timestamp
    );

    // Custom Errors
    error ZeroHashNotAllowed();
    error CertificateAlreadyExists(bytes32 certificateHash);
    error CertificateDoesNotExist(bytes32 certificateHash);
    error CertificateAlreadyRevoked(bytes32 certificateHash);
    error EmptyRevocationReason();

    /**
     * @notice Initializes the registry and assigns admin & issuer roles to the deployer.
     * @param defaultAdmin Address to receive the DEFAULT_ADMIN_ROLE and ISSUER_ROLE.
     */
    constructor(address defaultAdmin) {
        require(defaultAdmin != address(0), "Admin cannot be zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ISSUER_ROLE, defaultAdmin);
    }

    /**
     * @notice Registers an authentic certificate hash on-chain.
     * @dev Only addresses with ISSUER_ROLE can issue credentials.
     * @param _certificateHash The exact SHA-256 hash (in bytes32) of the final PDF bytes.
     */
    function issueCertificate(bytes32 _certificateHash) external onlyRole(ISSUER_ROLE) {
        if (_certificateHash == bytes32(0)) {
            revert ZeroHashNotAllowed();
        }

        if (_certificates[_certificateHash].issuedAt != 0) {
            revert CertificateAlreadyExists(_certificateHash);
        }

        _certificates[_certificateHash] = CertificateRecord({
            certificateHash: _certificateHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false,
            revokedAt: 0,
            revocationReason: ""
        });

        unchecked {
            totalIssued++;
        }

        emit CertificateIssued(_certificateHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Revokes an existing certificate on-chain.
     * @dev Only addresses with DEFAULT_ADMIN_ROLE can revoke certificates.
     * @param _certificateHash The SHA-256 hash of the certificate to revoke.
     * @param _reason Clear justification for the revocation.
     */
    function revokeCertificate(bytes32 _certificateHash, string calldata _reason)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (_certificateHash == bytes32(0)) {
            revert ZeroHashNotAllowed();
        }

        CertificateRecord storage cert = _certificates[_certificateHash];
        if (cert.issuedAt == 0) {
            revert CertificateDoesNotExist(_certificateHash);
        }

        if (cert.revoked) {
            revert CertificateAlreadyRevoked(_certificateHash);
        }

        if (bytes(_reason).length == 0) {
            revert EmptyRevocationReason();
        }

        cert.revoked = true;
        cert.revokedAt = block.timestamp;
        cert.revocationReason = _reason;

        unchecked {
            totalRevoked++;
        }

        emit CertificateRevoked(_certificateHash, msg.sender, _reason, block.timestamp);
    }

    /**
     * @notice Verifies whether a certificate hash is recorded and whether it is active.
     * @param _certificateHash The SHA-256 hash to verify.
     * @return exists True if the certificate was issued on this registry.
     * @return isValid True if the certificate exists and has not been revoked.
     * @return isRevoked True if the certificate was revoked.
     * @return issuer Address of the authorized issuer who anchored the credential.
     * @return issuedAt Unix timestamp of issuance.
     */
    function verifyCertificate(bytes32 _certificateHash)
        external
        view
        returns (
            bool exists,
            bool isValid,
            bool isRevoked,
            address issuer,
            uint256 issuedAt
        )
    {
        CertificateRecord memory cert = _certificates[_certificateHash];
        if (cert.issuedAt == 0) {
            return (false, false, false, address(0), 0);
        }

        exists = true;
        isRevoked = cert.revoked;
        isValid = !cert.revoked;
        issuer = cert.issuer;
        issuedAt = cert.issuedAt;
    }

    /**
     * @notice Returns full on-chain details for an anchored certificate hash.
     * @param _certificateHash The SHA-256 hash of the credential.
     */
    function getCertificateDetails(bytes32 _certificateHash)
        external
        view
        returns (CertificateRecord memory)
    {
        CertificateRecord memory cert = _certificates[_certificateHash];
        if (cert.issuedAt == 0) {
            revert CertificateDoesNotExist(_certificateHash);
        }
        return cert;
    }

    /**
     * @notice Helper to check revocation status in a single call.
     * @param _certificateHash The SHA-256 hash of the credential.
     */
    function isCertificateRevoked(bytes32 _certificateHash) external view returns (bool) {
        return _certificates[_certificateHash].revoked;
    }
}

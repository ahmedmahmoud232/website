# Firestore Security Spec - Arabic Platforms Directory

This document defines the security specifications, data invariants, and negative test targets ("Dirty Dozen" payload models) to audit access control.

## 1. Core Data Invariants
1. **Platform Owner Lock**: The creator of a platform is permanently associated with that platform document (`ownerId` cannot be changed after creation). Only the owner can edit the platform's metadata (name, URL, description, category, configuration).
2. **Upvote Coherence**: Upvoting/downvoting is secured through a robust, atomic interaction. An upvote/downvote requires writing/deleting in the `/platforms/{platformId}/upvotes/{userId}` subcollection, matching the user's authentic UID.
3. **Verified Sign-In**: To suppress spam, all writes (adding platforms, casting votes, writing advices) require a verified Google login (`request.auth.token.email_verified == true`).
4. **Description Formatting Validation**: Platforms description must follow strict size bounds to avoid denial of wallet attacks.

## 2. The "Dirty Dozen" Malicious Payloads
1. **Privilege Escalation Platform Hack**: Creating a platform with arbitrary `ownerId` set to a victim's UID.
2. **Double Vote Poisoning**: User tries to upvote multiple times by writing an upvote document under another user's ID.
3. **Infinite Upvote Exploitation**: Editing the parent `/platforms/{id}` document directly to arbitrarily bump `voteCount` to 9999 without casting an authentic upvote.
4. **Platform hijacking**: A non-owner user attempting to edit another user's platform specifications.
5. **Time Spoofing Attack**: Client-generated dynamic `createdAt` or `updatedAt` timestamps in the future instead of using `request.time`.
6. **Denial of Wallet String Injection**: Platform name or descriptions matching massive size (e.g. 1MB content injection).
7. **Empty String Content Poisoning**: Submitting empty platform name, category, or empty advice content to clutter clean visual streams.
8. **Malicious ID Overwrites**: Attempting to inject high-frequency characters/junk codes as Firestore Document IDs to poison path indexing.
9. **Spamming Advice as Owner**: Trying to spoof the author ID of advice strings to mimic trusted authorities.
10. **Malicious URL Phishing injection**: Registering script-based URLs or dangerous protocols.
11. **Anonymized Write Exploit**: Submitting writes with unverified, anonymous credentials.
12. **Tampering Immutable Fields**: Modifying standard fields like original `createdAt` or first `ownerId` after first entry.

## 3. Security Rules Verification Specs
Rules must return `PERMISSION_DENIED` on all malicious cases described above. No client-side checks can be trusted.

# Ada Permission Center & Security Architecture

## 1. Principles
Ada implements strict **least privilege** and zero blanket access. No single toggle grants full device or data permissions.

---

## 2. Risk Tiers

### Low Risk (Read-only, Reversible)
- **Examples**: Calendar read, weather retrieval, notes view, Spotify playback status.
- **Action**: Executes automatically once the integration toggle is explicitly granted by the user.

### Medium Risk (Create / Modify)
- **Examples**: Drafting emails, adding calendar entries, creating notes, staging git commits.
- **Action**: Presents an interactive confirmation card showing exact parameters before execution.

### High Risk (Send, Delete, External Impact)
- **Examples**: Sending outgoing emails/messages, deleting files, executing terminal shell scripts, modifying system settings.
- **Action**: Mandatory explicit confirmation every time with full payload audit inspection.

### Prohibited Actions (Never Allowed)
- Initiating payments, transferring money, accessing bank credentials, deleting files without recycle bin, accessing keychain/passwords.

---

## 3. Prompt-Injection Defense Shield
External data (incoming emails, web search results, third-party documents) is treated as **untrusted data**:
- Untrusted content can never authorize tool permissions.
- Hidden system prompts or jailbreak attempts in retrieved text are neutralized by regex inspection and sanitization before tool invocation.

---

## 4. Master Killswitch & Audit Logging
- **Global Pause**: The "Pause All Integrations" killswitch instantly blocks all tool interactions.
- **Audit Log**: Every access, token evaluation, and permission check is logged with timestamps and viewable/exportable from the Permission Center modal.

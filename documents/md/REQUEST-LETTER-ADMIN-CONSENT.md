# 📝 Request Letter for Azure AD Admin Consent

## Template for IT Department / System Administrator

---

**Subject:** Request for Admin Consent - TraviLink Email Directory Application (Azure AD)

**To:** IT Department / System Administrator  
**From:** [Your Name]  
**Date:** [Current Date]  
**Re:** Azure AD Application Permission Request

---

### Dear IT Department / System Administrator,

I hope this message finds you well. I am writing to request your assistance in granting admin consent for an Azure AD application that is part of our TraviLink Travel Request Management System project.

### Application Details:
- **Application Name:** TraviLink Email Directory
- **Application ID:** [Your Application (Client) ID from Azure Portal]
- **Tenant ID:** [Your Directory (Tenant) ID from Azure Portal]
- **Purpose:** Auto-fill user names and departments during registration using Azure Active Directory integration

### Permission Required:
- **Permission Name:** User.Read.All
- **Type:** Application Permission (not Delegated)
- **Description:** Read all users' full profiles
- **Admin Consent Required:** Yes

### Why This Permission is Needed:
The TraviLink system needs to automatically retrieve user information (name, department, position) from Azure AD when users register with their institutional email addresses. This will:
1. **Streamline registration** - Users won't need to manually enter their details
2. **Ensure data accuracy** - Information comes directly from the official directory
3. **Improve user experience** - Faster and more convenient registration process

### Security & Privacy:
- The application only reads basic user profile information (name, department, position)
- No sensitive data is accessed
- The application follows Microsoft's security best practices
- All data is used solely for the TraviLink system's registration process

### What We Need:
Please grant **admin consent** for the "User.Read.All" permission for the "TraviLink Email Directory" application in Azure AD.

### Steps to Grant Consent:
1. Go to Azure Portal → App registrations
2. Find "TraviLink Email Directory" application
3. Go to "API permissions"
4. Click "Grant admin consent for [Your Organization]"
5. Confirm the action

### Timeline:
We would appreciate if this could be completed by [Date] to proceed with testing and deployment.

### Contact Information:
If you need any additional information or have questions, please feel free to contact me at [Your Email] or [Your Phone Number].

Thank you for your time and assistance.

Best regards,  
[Your Name]  
[Your Position/Department]  
[Contact Information]

---

## Alternative: Short Version (Email)

**Subject:** Request: Azure AD Admin Consent for TraviLink Application

Hi [IT Admin Name],

I'm working on the TraviLink Travel Request Management System and need admin consent for an Azure AD application.

**App Name:** TraviLink Email Directory  
**Permission Needed:** User.Read.All (Application permission)  
**Purpose:** Auto-fill user details during registration

Could you please grant admin consent? The app is already registered in Azure AD, I just need the permission approved.

Steps:
1. Azure Portal → App registrations → "TraviLink Email Directory"
2. API permissions → "Grant admin consent"

Let me know if you need more details!

Thanks,  
[Your Name]


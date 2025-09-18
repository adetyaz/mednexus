## 🏥 Doctor Onboarding Guide - MedNexus Platform

### New Doctor? Welcome to MedNexus! 

When you connect your wallet for the first time, here's what you need to know:

### 🎯 **Current System Status**
- ✅ **Cross-border consultations** are now live
- ✅ **Doctor verification** system is active  
- ✅ **Institutional registration** is available
- ✅ **Global medical network** with multiple countries

---

### 📋 **Step-by-Step Onboarding Process:**

#### **1. Connect Your Wallet**
- Use your medical practice wallet address
- The system will automatically detect if you're one of our demo doctors

#### **2. Verify Medical Credentials** (`/verification`)
- Navigate to **Credential Verification** 
- Provide your medical license number
- Select your licensing authority (US-FSMB, UK-GMC, Canada-CPSO, etc.)
- System validates against blockchain medical authorities

#### **3. Join Medical Institution** (`/register`) 
- Select your hospital/clinic from verified institutions
- Provide institutional details
- Get approved by institution administrators
- Gain access to institutional document libraries

#### **4. Access Cross-Border Consultations** (`/consultations`)
- Send consultation requests to specialists worldwide
- Receive and respond to incoming consultation requests  
- Use 0G Chain for immutable medical record keeping

---

### 🎮 **Demo Doctor Testing**

If you're using one of our demo wallets:

| Doctor | Wallet Address | License Number | Institution |
|--------|---------------|----------------|-------------|
| **Dr. Sarah Johnson** | `0x99BD4BDD7A9c22E2a35F09A6Bd17f038D5E5eB87` | `CA-MD-789012` | Mercy General Hospital |
| **Dr. Michael Chen** | `0x59A0B39f49EBe851c97E654166A480E7d41122c6` | `UK-GMC-456789` | St. Mary's Hospital London |
| **Dr. Emily Rodriguez** | `0x8D8f96F92de3CbBc9b3c1048bDf3ce08DF7B1a40` | `ON-CPSO-123456` | Toronto General Hospital |

**Quick Demo Setup:**
1. Use your demo license number during verification
2. Select your corresponding institution 
3. System will auto-recognize and fast-track verification
4. Start sending consultation requests between demo doctors

---

### 🛠️ **What Happens Behind the Scenes**

1. **First Wallet Connect:**
   - System checks `medicalDocumentManager.getDoctorContext(walletAddress)`
   - If not found → Shows onboarding guidance
   - If found → Loads doctor profile and permissions

2. **Verification Process:**
   - Medical credentials validated against blockchain authorities
   - Institution affiliation confirmed
   - Doctor permissions and access levels assigned

3. **Cross-Wallet Consultations:**
   - Requests stored immutably on 0G Chain
   - Target doctors notified when they connect
   - Accept/reject responses recorded permanently

---

### 🔍 **Troubleshooting**

**"Doctor not found" error?**
→ Complete verification process first

**Can't see other doctors?**
→ Make sure you've joined an institution and been verified

**Consultations not working?**
→ Check that you're connected to 0G Testnet and have test tokens

**Demo credentials not working?**
→ Use the exact license numbers and institution names listed above

---

### 📞 **Need Help?**

The system includes:
- **Automatic demo doctor detection** - recognizes test wallets
- **Step-by-step verification guidance** - clear instructions for each step  
- **Institution selection assistance** - shows available verified hospitals
- **Real-time validation feedback** - immediate errors and success messages

Everything is designed to guide new doctors through the process smoothly!
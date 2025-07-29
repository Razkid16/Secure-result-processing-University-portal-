import crypto from "crypto"

// Conditional bcrypt import to avoid client-side issues
let bcrypt: any = null;
if (typeof window === "undefined") {
  // Server-side only
  try {
    bcrypt = require("bcrypt");
  } catch (error) {
    console.error("Failed to load bcrypt:", error);
  }
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex")
const ALGORITHM = "aes-256-gcm"

export class CryptoService {
  // Hash password using bcrypt
  static async hashPassword(password: string): Promise<string> {
    if (!bcrypt) {
      throw new Error("bcrypt not available");
    }
    const saltRounds = 10
    return bcrypt.hash(password, saltRounds)
  }

  // Verify password using bcrypt
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    if (!bcrypt) {
      console.error("bcrypt not available for password verification");
      return false;
    }
    try {
      return bcrypt.compare(password, hashedPassword)
    } catch (error) {
      console.error("Password verification error:", error)
      return false
    }
  }

  // Encrypt sensitive data
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16)
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), "utf8")
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    const tag = cipher.getAuthTag().toString("hex")

    return {
      encrypted,
      iv: iv.toString("hex"),
      tag,
    }
  }

  // Decrypt sensitive data
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), "utf8")
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(encryptedData.iv, "hex"))

    decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"))

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  }

  // Generate secure hash for data integrity
  static generateHash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex")
  }

  // Generate secure session token
  static generateSessionToken(): string {
    return crypto.randomBytes(32).toString("hex")
  }

  // Generate secure API key
  static generateApiKey(): string {
    return crypto.randomBytes(24).toString("base64url")
  }

  // Verify data integrity
  static verifyHash(data: string, hash: string): boolean {
    const computedHash = this.generateHash(data)
    return computedHash === hash
  }

  // Generate HMAC signature
  static generateHMAC(data: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(data).digest("hex")
  }

  // Verify HMAC signature
  static verifyHMAC(data: string, signature: string, secret: string): boolean {
    const computedSignature = this.generateHMAC(data, secret)
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature))
  }

  // Digital Signature Methods
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  static signData(data: string, privateKey: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'base64');
  }

  static verifySignature(data: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      verify.end();
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      return false;
    }
  }

  static generateCertificate(
    publicKey: string,
    userId: number,
    userName: string,
    userEmail: string,
    role: string,
    validDays: number = 365
  ): string {
    const now = new Date();
    const validUntil = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);
    
    const certificateData = {
      version: '1.0',
      serialNumber: crypto.randomBytes(16).toString('hex'),
      issuer: 'Secure Academic System CA',
      subject: {
        userId,
        userName,
        userEmail,
        role
      },
      publicKey: publicKey.split('\n').slice(1, -2).join(''), // Remove PEM headers
      validFrom: now.toISOString(),
      validUntil: validUntil.toISOString(),
      signatureAlgorithm: 'SHA256withRSA'
    };

    // Create a self-signed certificate (in real systems, this would be signed by a CA)
    const certificateString = JSON.stringify(certificateData, null, 2);
    // For demo purposes, we'll create a simple hash-based signature since we don't have a CA private key
    const signature = this.generateHash(certificateString);

    return JSON.stringify({
      ...certificateData,
      signature
    }, null, 2);
  }

  static verifyCertificate(certificate: string): boolean {
    try {
      const certData = JSON.parse(certificate);
      const { signature, ...dataToVerify } = certData;
      
      // Check if certificate is expired
      if (new Date(certData.validUntil) < new Date()) {
        return false;
      }

      // Verify the signature (hash-based for demo)
      const dataString = JSON.stringify(dataToVerify, null, 2);
      return this.verifyHash(dataString, signature);
    } catch (error) {
      return false;
    }
  }

  static createResultSignature(
    resultId: number,
    userId: number,
    action: 'submit' | 'approve' | 'deny' | 'publish',
    timestamp: string,
    dataHash: string
  ): string {
    const signatureData = {
      resultId,
      userId,
      action,
      timestamp,
      dataHash,
      version: '1.0'
    };

    return JSON.stringify(signatureData, null, 2);
  }

  static verifyResultSignature(
    signatureData: string,
    signature: string,
    publicKey: string
  ): boolean {
    return this.verifySignature(signatureData, signature, publicKey);
  }

  // RSA Encryption/Decryption for secure file downloads
  static encryptWithPublicKey(data: string, publicKey: string): string {
    try {
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(data, 'utf8')
      );
      return encrypted.toString('base64');
    } catch (error) {
      console.error('RSA encryption error:', error);
      throw new Error('Failed to encrypt data with public key');
    }
  }

  static decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
    try {
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(encryptedData, 'base64')
      );
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('RSA decryption error:', error);
      throw new Error('Failed to decrypt data with private key');
    }
  }

  // Hybrid encryption: Use AES for data, RSA for AES key
  static hybridEncrypt(data: string, publicKey: string): { encryptedData: string; encryptedKey: string; iv: string } {
    // Generate a random AES key
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    // Encrypt the data with AES
    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
    let encryptedData = cipher.update(data, 'utf8', 'base64');
    encryptedData += cipher.final('base64');
    
    // Encrypt the AES key with RSA public key
    const encryptedKey = this.encryptWithPublicKey(aesKey.toString('base64'), publicKey);
    
    return {
      encryptedData,
      encryptedKey,
      iv: iv.toString('base64')
    };
  }

  static hybridDecrypt(encryptedData: string, encryptedKey: string, iv: string, privateKey: string): string {
    // Decrypt the AES key with RSA private key
    const aesKeyBase64 = this.decryptWithPrivateKey(encryptedKey, privateKey);
    const aesKey = Buffer.from(aesKeyBase64, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    
    // Decrypt the data with AES
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, ivBuffer);
    let decryptedData = decipher.update(encryptedData, 'base64', 'utf8');
    decryptedData += decipher.final('utf8');
    
    return decryptedData;
  }

  // Custom Secure File Format Functions
  static createSecureFile(data: any, publicKey: string): { fileContent: string; fileExtension: string } {
    // Create file header with metadata
    const fileHeader = {
      format: 'SECURE_ACADEMIC_RESULTS',
      version: '1.0',
      created: new Date().toISOString(),
      encryption: 'RSA-2048 + AES-256',
      requiresPrivateKey: true,
      description: 'This file requires your private key to decrypt and view the contents'
    };

    // Combine header and data
    const fullContent = {
      header: fileHeader,
      data: data
    };

    // Encrypt the entire content
    const encryptedContent = this.hybridEncrypt(JSON.stringify(fullContent, null, 2), publicKey);

    // Create the secure file format
    const secureFile = {
      magic: 'SECURE_ACADEMIC_FILE',
      version: '1.0',
      timestamp: new Date().toISOString(),
      encryptedContent: encryptedContent,
      fileType: 'academic_results',
      instructions: 'Use your private key to decrypt this file'
    };

    return {
      fileContent: JSON.stringify(secureFile, null, 2),
      fileExtension: '.secure'
    };
  }

  static decryptSecureFile(secureFileContent: string, privateKey: string): any {
    try {
      // Parse the secure file
      const secureFile = JSON.parse(secureFileContent);
      
      // Validate file format
      if (secureFile.magic !== 'SECURE_ACADEMIC_FILE') {
        throw new Error('Invalid secure file format');
      }

      // Decrypt the content
      const decryptedContent = this.hybridDecrypt(
        secureFile.encryptedContent.encryptedData,
        secureFile.encryptedContent.encryptedKey,
        secureFile.encryptedContent.iv,
        privateKey
      );

      // Parse the decrypted content
      const parsedContent = JSON.parse(decryptedContent);
      
      return parsedContent;
    } catch (error) {
      throw new Error(`Failed to decrypt secure file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validate secure file format
  static isValidSecureFile(content: string): boolean {
    try {
      const file = JSON.parse(content);
      return file.magic === 'SECURE_ACADEMIC_FILE' && 
             file.version && 
             file.encryptedContent &&
             file.encryptedContent.encryptedData &&
             file.encryptedContent.encryptedKey &&
             file.encryptedContent.iv;
    } catch {
      return false;
    }
  }

  // PDF Encryption Functions
  static createSecurePDF(data: any, publicKey: string): { pdfContent: string; fileExtension: string } {
    // Create a PDF-like structure that can be opened
    const pdfHeader = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 1000
>>
stream
BT
/F1 12 Tf
72 720 Td
(ENCRYPTED ACADEMIC RESULTS) Tj
/F1 10 Tf
72 700 Td
(This file contains encrypted academic results.) Tj
72 680 Td
(To decrypt and view the contents, use the decrypt function) Tj
72 660 Td
(in the student portal with your private key.) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
350
%%EOF`;

    // Create PDF metadata
    const pdfMetadata = {
      format: 'SECURE_ACADEMIC_RESULTS_PDF',
      version: '1.0',
      created: new Date().toISOString(),
      encryption: 'RSA-2048 + AES-256',
      requiresPrivateKey: true,
      description: 'This PDF requires your private key to decrypt and view the contents'
    };

    // Combine metadata and data
    const fullContent = {
      metadata: pdfMetadata,
      data: data
    };

    // Encrypt the content
    const encryptedContent = this.hybridEncrypt(JSON.stringify(fullContent, null, 2), publicKey);

    // Create a comment in the PDF with the encrypted data
    const encryptedComment = `%ENCRYPTED_DATA:${JSON.stringify(encryptedContent)}`;

    return {
      pdfContent: pdfHeader + '\n' + encryptedComment,
      fileExtension: '.pdf'
    };
  }

  static decryptSecurePDF(pdfContent: string, privateKey: string): any {
    try {
      // Check if it's the new PDF format with embedded encrypted data
      if (pdfContent.includes('%ENCRYPTED_DATA:')) {
        // Extract the encrypted data from the PDF comment
        const encryptedDataMatch = pdfContent.match(/%ENCRYPTED_DATA:(.+)$/m);
        if (!encryptedDataMatch) {
          throw new Error('No encrypted data found in PDF');
        }

        const encryptedContent = JSON.parse(encryptedDataMatch[1]);

        // Decrypt the content
        const decryptedContent = this.hybridDecrypt(
          encryptedContent.encryptedData,
          encryptedContent.encryptedKey,
          encryptedContent.iv,
          privateKey
        );

        // Parse the decrypted content
        const parsedContent = JSON.parse(decryptedContent);
        
        return parsedContent;
      } else {
        // Fallback to old JSON format
        const pdfStructure = JSON.parse(pdfContent);
        
        // Validate PDF format
        if (pdfStructure.magic !== 'SECURE_ACADEMIC_PDF') {
          throw new Error('Invalid secure PDF format');
        }

        // Decrypt the content
        const decryptedContent = this.hybridDecrypt(
          pdfStructure.encryptedContent.encryptedData,
          pdfStructure.encryptedContent.encryptedKey,
          pdfStructure.encryptedContent.iv,
          privateKey
        );

        // Parse the decrypted content
        const parsedContent = JSON.parse(decryptedContent);
        
        return parsedContent;
      }
    } catch (error) {
      throw new Error(`Failed to decrypt secure PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validate secure PDF format
  static isValidSecurePDF(content: string): boolean {
    try {
      // Check for new PDF format with embedded encrypted data
      if (content.includes('%ENCRYPTED_DATA:')) {
        const encryptedDataMatch = content.match(/%ENCRYPTED_DATA:(.+)$/m);
        if (!encryptedDataMatch) return false;
        
        const encryptedContent = JSON.parse(encryptedDataMatch[1]);
        return encryptedContent.encryptedData && 
               encryptedContent.encryptedKey && 
               encryptedContent.iv;
      }
      
      // Fallback to old JSON format
      const file = JSON.parse(content);
      return file.magic === 'SECURE_ACADEMIC_PDF' && 
             file.version && 
             file.encryptedContent &&
             file.encryptedContent.encryptedData &&
             file.encryptedContent.encryptedKey &&
             file.encryptedContent.iv;
    } catch {
      return false;
    }
  }
}





async function encrypt(email, password, securityKey) {
    const dataToEncrypt = { email, password };

    // Convert the data to a JSON string
    const jsonString = JSON.stringify(dataToEncrypt);

    // Convert the JSON string to a Uint8Array
    const encoder = new TextEncoder();
    const dataToEncryptUint8 = encoder.encode(jsonString);

    // Derive a key from the security key using a key derivation function (KDF)
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(securityKey),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: new Uint8Array(16), // Use a unique salt
            iterations: 100000, // Adjust the number of iterations as needed
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    // Encrypt the data using AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        dataToEncryptUint8
    );

    // Convert the IV and encrypted data to a hexadecimal string
    const encryptedString = Array.from(iv)
        .concat(Array.from(new Uint8Array(encryptedData)))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');

    return encryptedString;
}

async function decrypt(encryptedString, securityKey) {
    // Convert the encrypted string to a Uint8Array
    const decoder = new TextDecoder('utf-8');
    const encryptedData = new Uint8Array(
        encryptedString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );

    // Derive a key from the security key using a key derivation function (KDF)
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(securityKey),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: new Uint8Array(16), // Use a unique salt
            iterations: 100000, // Adjust the number of iterations as needed
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    // Extract the IV from the first 12 bytes of the encrypted data
    const iv = encryptedData.slice(0, 12);

    // Decrypt the remaining data using AES-GCM
    const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        encryptedData.slice(12)
    );

    // Convert the decrypted data to a string
    const decryptedString = decoder.decode(new Uint8Array(decryptedData));

    // Parse the decrypted string to a JSON object
    const decryptedObject = JSON.parse(decryptedString);

    return decryptedObject;
}


// // Example usage
// async function runExample() {
//     const userEmail = 'user@example.com';
//     const userPassword = 'secretpassword';
//     const securityKey = 'your_secret_key';

//     try {
//         const encryptedData = await encrypt(userEmail, userPassword, securityKey);
//         console.log('Encrypted data:', encryptedData);

//         const decryptedData = await decrypt(encryptedData, securityKey);
//         console.log('Decrypted data:', decryptedData);
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }


const key = "zPL+=kHBbkUOM7$M!N@idDS9xs+ike@h"

export {encrypt, decrypt, key}
const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");

class KVContract extends Contract {
  constructor() {
    super("KVContract");
  }

  async instantiate() {
   
  }

async registerSingleDID(ctx, email, phoneNumber, did, data) {
  const callerMSP = ctx.clientIdentity.getMSPID();
  if (callerMSP !== "OrgGovMSP") {
    throw new Error("Only OrgGov can register identities.");
  }

  const ownerID = ctx.clientIdentity.getID();
  let parsedData;
  try {
    parsedData = JSON.parse(data);
  } catch (error) {
    throw new Error("Invalid JSON format for data: " + error.message);
  }

  const certificateType = parsedData.certificateType;
  if (!certificateType) {
    throw new Error("Missing 'certificateType' in submitted data.");
  }

  const now = new Date().toISOString();
  const identityBuffer = await ctx.stub.getState(phoneNumber);
  let identity;

  if (!identityBuffer || identityBuffer.length === 0) {
    // Fresh identity
    identity = {
      phoneNumber,
      dids: {
        [did]: {
          ...parsedData,
          createdAt: now,
          isRevoked: false,
          revokedAt: null,
          issuedBy: email,
          revokedBy: null,
        },
      },
      verifiedBy: {},
      revoked: false,
      owners: [ownerID],
      createdAt: now,
    };
  } else {
    identity = JSON.parse(identityBuffer.toString());

    // ✅ Check if same certificateType exists AND is not revoked
    const hasActiveSameType = Object.values(identity.dids || {}).some(
      (entry) =>
        entry.certificateType === certificateType && entry.isRevoked === false
    );

    if (hasActiveSameType) {
      throw new Error(
        `An active certificate of type '${certificateType}' already exists for phone number '${phoneNumber}'.`
      );
    }

    // Prevent overwriting same DID key
    if (identity.dids[did]) {
      throw new Error(
        `DID '${did}' already exists. Updating existing DIDs is not allowed.`
      );
    }

    identity.dids[did] = {
      ...parsedData,
      createdAt: now,
      isRevoked: false,
      revokedAt: null,
      issuedBy: email,
      revokedBy: null,
    };

    if (!identity.owners.includes(ownerID)) {
      identity.owners.push(ownerID);
    }
  }

  await ctx.stub.putState(phoneNumber, Buffer.from(JSON.stringify(identity)));
  return { success: `DID '${did}' registered successfully` };
}




async registerMultipleDIDs(ctx, email,phoneNumber, didsJson) {
  const callerMSP = ctx.clientIdentity.getMSPID();
  if (callerMSP !== "OrgGovMSP") {
    throw new Error("Only OrgGov can register identities.");
  }

  const ownerID = ctx.clientIdentity.getID();
  let newDIDs;
  try {
    newDIDs = JSON.parse(didsJson);
  } catch (error) {
    throw new Error("Invalid JSON format for DIDs: " + error.message);
  }

  let identityBuffer = await ctx.stub.getState(phoneNumber);
  let identity;

  if (!identityBuffer || identityBuffer.length === 0) {
    // Create a new identity if it doesn't exist
    identity = {
      phoneNumber,
      dids: {},
      verifiedBy: {},
      revoked: false,
      owners: [ownerID],
      createdAt: new Date().toISOString(),
    };
  } else {
    identity = JSON.parse(identityBuffer.toString());

    // If the ownerID is not already listed, add them
    if (!identity.owners.includes(ownerID)) {
      identity.owners.push(ownerID);
    }
  }

  // Ensure new DIDs don't already exist; if any do, reject entirely
  for (const didKey in newDIDs) {
    if (identity.dids[didKey]) {
      throw new Error(`DID '${didKey}' already exists. Updating existing DIDs is not allowed.`);
    }
  }

  // Add each new DID with createdAt timestamp
  const nowIso = new Date().toISOString();
  for (const didKey in newDIDs) {
        identity.dids[didKey] = {
      ...newDIDs[didKey],
      createdAt: nowIso,
      isRevoked: false,
      revokedAt: null,
      issuedBy: email, 
      revokedBy: null,// Store the issuer's email
    };
  }

  await ctx.stub.putState(phoneNumber, Buffer.from(JSON.stringify(identity)));
  return { success: `Multiple DIDs (${Object.keys(newDIDs).join(", ")}) registered successfully` };
}




async registerBulkDIDs(ctx, email, bulkJson) {
  const callerMSP = ctx.clientIdentity.getMSPID();
  if (callerMSP !== "OrgGovMSP") {
    throw new Error("Only OrgGov can register identities.");
  }

  const ownerID = ctx.clientIdentity.getID();
  const nowIso = new Date().toISOString();

  let bulkMap;
  try {
    bulkMap = JSON.parse(bulkJson);
    if (typeof bulkMap !== "object" || bulkMap === null || Array.isArray(bulkMap)) {
      throw new Error("Expected an object mapping phoneNumber → didMap.");
    }
  } catch (err) {
    throw new Error("Invalid JSON format for bulk DIDs: " + err.message);
  }

  const toWrite = {}; // phoneNumber → updated identity

  for (const phoneNumber of Object.keys(bulkMap)) {
    const didsJsonObj = bulkMap[phoneNumber];
    if (typeof didsJsonObj !== "object" || didsJsonObj === null || Array.isArray(didsJsonObj)) {
      throw new Error(`For phoneNumber '${phoneNumber}', expected an object of DIDs → data.`);
    }

    const identityBuffer = await ctx.stub.getState(phoneNumber);
    let identity;

    if (!identityBuffer || identityBuffer.length === 0) {
      identity = {
        phoneNumber,
        dids: {},
        verifiedBy: {},
        revoked: false,
        owners: [ownerID],
        createdAt: nowIso
      };
    } else {
      identity = JSON.parse(identityBuffer.toString());
      if (!identity.owners.includes(ownerID)) {
        identity.owners.push(ownerID);
      }
    }

    // Build a set of existing non-revoked certificateTypes
    const existingTypes = new Set();
    for (const existingDID of Object.values(identity.dids)) {
      if (existingDID.certificateType && existingDID.isRevoked === false) {
        existingTypes.add(existingDID.certificateType);
      }
    }

    const seenCertTypes = new Set(); // Track certificateTypes in this batch
    for (const didKey of Object.keys(didsJsonObj)) {
      const newData = didsJsonObj[didKey];
      const certType = newData.certificateType;

      if (!certType) {
        throw new Error(`Missing 'certificateType' in data for DID '${didKey}'`);
      }

      // Skip if already seen in this batch or already exists (and not revoked)
      if (seenCertTypes.has(certType) || existingTypes.has(certType)) {
        continue;
      }

      // Accept it
      identity.dids[didKey] = {
        ...newData,
        createdAt: nowIso,
        isRevoked: false,
        revokedAt: null,
        issuedBy: email,
        revokedBy: null
      };

      seenCertTypes.add(certType);
    }

    toWrite[phoneNumber] = identity;
  }

  // Write all identities to the ledger
  for (const phoneNumber of Object.keys(toWrite)) {
    await ctx.stub.putState(phoneNumber, Buffer.from(JSON.stringify(toWrite[phoneNumber])));
  }

  return {
    success: `Bulk registration completed for phoneNumbers: ${Object.keys(toWrite).join(", ")}`
  };
}




async addDID(ctx, email, phoneNumber, newDID, data) {
  const callerMSP = ctx.clientIdentity.getMSPID();
  if (callerMSP !== "OrgGovMSP") {
    throw new Error("Only OrgGov can add DIDs.");
  }

  const identityBuffer = await ctx.stub.getState(phoneNumber);
  if (!identityBuffer || identityBuffer.length === 0) {
    throw new Error("Identity not found");
  }

  let identity = JSON.parse(identityBuffer.toString());

  if (identity.dids[newDID]) {
    throw new Error(`DID '${newDID}' already exists. Updating existing DIDs is not allowed.`);
  }

  let parsedData;
  try {
    parsedData = JSON.parse(data);
  } catch (error) {
    throw new Error("Invalid JSON format for DID data: " + error.message);
  }

  const newCertType = parsedData.certificateType;
  if (!newCertType) {
    throw new Error("Missing 'certificateType' in data payload.");
  }

  // Check for existing active certificateType
  const didEntries = identity.dids || {};
  for (const existingDID in didEntries) {
    const cert = didEntries[existingDID];
    if (
      cert.certificateType === newCertType &&
      cert.isRevoked === false
    ) {
      throw new Error(
        `An active certificate of type '${newCertType}' already exists. Revoke it before adding a new one.`
      );
    }
  }

  // Add the new DID
  identity.dids[newDID] = {
    ...parsedData,
    createdAt: new Date().toISOString(),
    isRevoked: false,
    revokedAt: null,
    issuedBy: email,
    revokedBy: null,
  };

  await ctx.stub.putState(phoneNumber, Buffer.from(JSON.stringify(identity)));
  return { success: `DID '${newDID}' added successfully` };
}

async revokeDID(ctx, email,phoneNumber, did) {
  const callerMSP = ctx.clientIdentity.getMSPID();
  if (callerMSP !== "OrgGovMSP") {
    throw new Error("Only OrgGov can remove DIDs.");
  }

  const identityBuffer = await ctx.stub.getState(phoneNumber);
  if (!identityBuffer || identityBuffer.length === 0) {
    throw new Error("Identity not found");
  }

  let identity = JSON.parse(identityBuffer.toString());

  if (!identity.dids[did]) {
    throw new Error(`DID '${did}' not found.`);
  }

  // Update the DID instead of deleting it: Set isRevoked to true and add revokedAt
  identity.dids[did].isRevoked = true;
  identity.dids[did].revokedAt = new Date().toISOString(); // Set the current timestamp
  identity.dids[did].revokedBy = email; // Store the revoker's email


  await ctx.stub.putState(phoneNumber, Buffer.from(JSON.stringify(identity)));
  return { success: `DID '${did}' revoked successfully` };
}


async revokeMultipleDIDs(ctx, email,didsJson) {
  const callerMSP = ctx.clientIdentity.getMSPID();
  if (callerMSP !== "OrgGovMSP") {
    throw new Error("Only OrgGov can revoke DIDs.");
  }

  // 1) Parse the incoming JSON string into an array
  let dids;
  try {
    dids = JSON.parse(didsJson);
  } catch {
    throw new Error("Invalid JSON format for DIDs array.");
  }

  // 2) Validate that `dids` is truly an array of strings
  if (!Array.isArray(dids) || dids.some(d => typeof d !== "string")) {
    throw new Error("DIDs should be an array of strings.");
  }

  const now = new Date().toISOString();
  const stub = ctx.stub;
  const identitiesToUpdate = [];

  // 3) Iterate through each DID, find the matching phoneNumber, and mark revoked
  for (const did of dids) {
    // Obtain a range iterator for all keys
    const iterator = await stub.getStateByRange("", "");
    let found = false;

    // Use iterator.next() instead of for-await
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value) {
        // res.value.key is the phoneNumber
        // res.value.value is the state buffer
        const identity = JSON.parse(res.value.value.toString("utf8"));
        if (identity.dids && identity.dids[did]) {
          identity.dids[did].isRevoked = true;
          identity.dids[did].revokedAt = now;
          identity.dids[did].revokedBy = email; // Store the revoker's email
          identitiesToUpdate.push({ phoneNumber: res.value.key, identity });
          found = true;
          break; // stop scanning once we find this DID
        }
      }
      if (res.done) {
        break;
      }
    }

    // Always close the iterator when finished
    await iterator.close();

    if (!found) {
      throw new Error(`DID '${did}' not found in any phoneNumber.`);
    }
  }

  // 4) Write back all updated identities
  for (const { phoneNumber, identity } of identitiesToUpdate) {
    await stub.putState(
      phoneNumber,
      Buffer.from(JSON.stringify(identity))
    );
  }

  return { success: `${dids.length} DIDs revoked successfully` };
}


async deleteDID(ctx, phoneNumber, did) {
  const callerMSP = ctx.clientIdentity.getMSPID();
  if (callerMSP !== "OrgGovMSP") {
    throw new Error("Only OrgGov can delete DIDs.");
  }

  
  const identityBuffer = await ctx.stub.getState(phoneNumber);
  if (!identityBuffer || identityBuffer.length === 0) {
    throw new Error(`Identity with phoneNumber '${phoneNumber}' not found.`);
  }

  let identity = JSON.parse(identityBuffer.toString());

  
  if (!identity.dids || !identity.dids[did]) {
    throw new Error(`DID '${did}' not found under phoneNumber '${phoneNumber}'.`);
  }

  // Delete the DID from the object
  delete identity.dids[did];

  // Optionally, clean up empty `dids` object
  if (Object.keys(identity.dids).length === 0) {
    identity.dids = {};
  }

  // Write updated identity back to the ledger
  await ctx.stub.putState(phoneNumber, Buffer.from(JSON.stringify(identity)));

  return { success: `DID '${did}' deleted successfully from phoneNumber '${phoneNumber}'.` };
}



  async getRevokedDIDs(ctx) {
    const callerMSP = ctx.clientIdentity.getMSPID();
    if (callerMSP !== "OrgGovMSP") {
      throw new Error("Only OrgGov can retrieve revoked DIDs.");
    }

    const iterator = await ctx.stub.getStateByRange("", "");
    const revokedResults = [];

    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value) {
        const recordKey = res.value.key; // this is the phoneNumber
        const identity = JSON.parse(res.value.value.toString("utf8"));
        
        // Build a new map containing only those DIDs where isRevoked === true
        const filteredDIDs = {};
        for (const [didKey, didData] of Object.entries(identity.dids || {})) {
          if (didData.isRevoked === true) {
            filteredDIDs[didKey] = didData;
          }
        }
        
        // If there is at least one revoked DID in this identity, include it
        if (Object.keys(filteredDIDs).length > 0) {
          revokedResults.push({
            phoneNumber: recordKey,
            dids: filteredDIDs,
            owners: identity.owners,
            createdAt: identity.createdAt
          });
        }
      }
      if (res.done) {
        break;
      }
    }
    await iterator.close();

    return { response: { revokedDIDs: revokedResults } };
  }


  async getActiveDIDs(ctx) {
    const callerMSP = ctx.clientIdentity.getMSPID();
    if (callerMSP !== "OrgGovMSP") {
      throw new Error("Only OrgGov can retrieve active DIDs.");
    }

    const iterator = await ctx.stub.getStateByRange("", "");
    const activeResults = [];

    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value) {
        const recordKey = res.value.key; // this is the phoneNumber
        const identity = JSON.parse(res.value.value.toString("utf8"));
        
        // Build a new map containing only those DIDs where isRevoked === false
        const filteredDIDs = {};
        for (const [didKey, didData] of Object.entries(identity.dids || {})) {
          if (didData.isRevoked === false) {
            filteredDIDs[didKey] = didData;
          }
        }
        
        // If there is at least one active DID in this identity, include it
        if (Object.keys(filteredDIDs).length > 0) {
          activeResults.push({
            phoneNumber: recordKey,
            dids: filteredDIDs,
            owners: identity.owners,
            createdAt: identity.createdAt
          });
        }
      }
      if (res.done) {
        break;
      }
    }
    await iterator.close();

    return { response: { activeDIDs: activeResults } };
  }



async getDIDForVerifier(ctx, phoneNumber, did) {
 
  const callerMSP = ctx.clientIdentity.getMSPID();
  if (callerMSP !== "OrgVerifierMSP") {
      throw new Error("Only OrgVerifier1 can retrieve DID details.");
  }

  const identityBuffer = await ctx.stub.getState(phoneNumber);
  if (!identityBuffer || identityBuffer.length === 0) {
      throw new Error("Identity not found");
  }

  let identity = JSON.parse(identityBuffer.toString());

  if (!identity.verifiedBy[did] || !identity.verifiedBy[did].includes(callerMSP)) {
      throw new Error(`Access denied: Verifier ${callerMSP} does not have access to DID ${did}`);
  }

  return identity.dids[did];  
}


  async getIdentity(ctx, phoneNumber) {
    const identityBuffer = await ctx.stub.getState(phoneNumber);
    if (!identityBuffer || identityBuffer.length === 0) {
      return { error: "Identity not found" };
    }
    return JSON.parse(identityBuffer.toString());
  }

  async queryDID(ctx, phoneNumber, did) {
    const identityBuffer = await ctx.stub.getState(phoneNumber);
    if (!identityBuffer || identityBuffer.length === 0) {
      return { error: "Identity not found" };
    }

    let identity = JSON.parse(identityBuffer.toString());
    return identity.dids[did];
  }


  async getAllDIDs(ctx) {
    const callerMSP = ctx.clientIdentity.getMSPID();
    if (callerMSP !== "OrgGovMSP") {
      throw new Error("Only OrgGov can retrieve all DID details.");
    }
  
    const iterator = await ctx.stub.getStateByRange("", "");
    let allDIDs = [];
  
    let res = await iterator.next();
    while (!res.done) {
      let record = res.value;
      let identity = JSON.parse(record.value.toString());
  
      allDIDs.push({
        phoneNumber: record.key,
        dids: identity.dids,
        owners: identity.owners,
        createdAt: identity.createdAt,
      });
  
      res = await iterator.next();
    }
    await iterator.close();
  
    return { allDIDs };
  }


  async getDIDDetails(ctx, did) {
    const callerMSP = ctx.clientIdentity.getMSPID();
    if (callerMSP !== "OrgGovMSP" && callerMSP !== "OrgVerifierMSP") {
      throw new Error("Only OrgGov or OrgVerifier1 can retrieve DID details.");
    }
  
    const iterator = await ctx.stub.getStateByRange("", "");
    
    while (true) {
      const res = await iterator.next();
  
      if (res.value && res.value.value.toString()) {
        const identity = JSON.parse(res.value.value.toString());
  
        if (identity.dids && identity.dids[did]) {
          await iterator.close();
          return identity.dids[did];  // return DID JSON directly
        }
      }
  
      if (res.done) {
        break;
      }
    }
  
    await iterator.close();
    throw new Error(`DID '${did}' not found in any identity.`);
  }


  async getMultipleDIDDetails(ctx, didsJson) {
    const callerMSP = ctx.clientIdentity.getMSPID();
    if (callerMSP !== "OrgGovMSP" && callerMSP !== "OrgVerifierMSP") {
      throw new Error("Only OrgGov or OrgVerifier1 can retrieve DID details.");
    }
  
    let didsArray;
    try {
      didsArray = JSON.parse(didsJson);
      if (!Array.isArray(didsArray)) {
        throw new Error("Input must be a JSON array of DIDs.");
      }
    } catch (error) {
      throw new Error("Invalid JSON format for DIDs: " + error.message);
    }
  
    const iterator = await ctx.stub.getStateByRange("", "");
    let resultMap = {};
  
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value.toString()) {
        const identity = JSON.parse(res.value.value.toString());
  
        for (let did of didsArray) {
          if (identity.dids && identity.dids[did]) {
            resultMap[did] = identity.dids[did];
          }
        }
      }
  
      if (res.done) {
        break;
      }
    }
  
    await iterator.close();
  
    // Check if any requested DIDs were not found
    for (let did of didsArray) {
      if (!resultMap[did]) {
        resultMap[did] = { error: `DID '${did}' not found.` };
      }
    }
  
    return resultMap;
  }
  
  


}

exports.contracts = [KVContract];




import * as dbBridge from '../utils/dbBridge.js';

export const getAllCustomers = async (req, res) => {
  try {
    const list = await dbBridge.getCustomers();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCustomerByCIF = async (req, res) => {
  try {
    const customer = await dbBridge.getCustomer(req.params.cif);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getGuardianByCIF = async (req, res) => {
  try {
    const guardians = await dbBridge.getGuardians(req.params.cif);
    if (guardians.length === 0) {
      return res.status(404).json({ error: 'No guardian registered for this account' });
    }
    res.json(guardians[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const enrollGuardian = async (req, res) => {
  try {
    const { cif } = req.params;
    const { guardianName, relationship, phone } = req.body;
    if (!guardianName || !relationship || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    await dbBridge.addGuardian({ cif, guardianName, relationship, phone });

    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Customer security portal',
      event: `Guardian Enrolled: ${guardianName} (${relationship})`,
      riskScore: 5,
      riskFactors: [],
      decision: 'GUARDIAN_ENROLLED'
    });

    res.status(201).json({ cif, guardianName, relationship, phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

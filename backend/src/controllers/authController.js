import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'TrustGuard_AI_SACH_Kavach_2026';

export const loginUser = async (req, res) => {
  try {
    const { username, cif } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const token = jwt.sign(
      { username, cif: cif || 'CIF100000', role: username === 'admin' ? 'admin' : 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, username, cif: cif || 'CIF100000', role: username === 'admin' ? 'admin' : 'user' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

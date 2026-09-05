const path = require('path');
const dotenv = require('dotenv');

// Always resolve the backend environment file from the package directory.
// This keeps configuration stable whether the server is launched from the
// repository root, through npm workspaces, or directly from this package.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


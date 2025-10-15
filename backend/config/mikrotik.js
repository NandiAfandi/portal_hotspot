// config/mikrotik.js
import { RouterOSClient } from "routeros-client";

const createMikrotikConnection = async () => {
  const api = new RouterOSClient({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASSWORD,
    port: process.env.MIKROTIK_PORT || 8728,
  });

  const client = await api.connect();
  return { api, client };
};

export default createMikrotikConnection;

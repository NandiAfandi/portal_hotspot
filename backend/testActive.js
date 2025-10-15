import { getActiveUsers } from "./services/mikrotikService.js";

const test = async () => {
  const data = await getActiveUsers();
  console.log(data);
};

test();

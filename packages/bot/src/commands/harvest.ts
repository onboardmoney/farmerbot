import { User } from "src/types";

export const HARVEST_COMMAND = "polinate"

export async function harvest(user: User, args: any[]): Promise<any> {
  const [word, target] = args;
  
}

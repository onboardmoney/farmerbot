import { User } from "src/types";

export const GIVE_COMMAND = "give"

export async function give(user: User, args: any[]): Promise<any> {
  const [amount, word1, word2, target] = args;
  
}

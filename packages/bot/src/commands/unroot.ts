import { User } from "src/types";

export const UNROOT_COMMAND = "polinate"

export async function unroot(user: User, args: any[]): Promise<any> {
  const [_, target] = args;
  
}

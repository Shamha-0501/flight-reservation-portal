import { User } from "../models/User";
import { Controller } from "./Controller";

export class UserController extends Controller {
  public async index() {
    const found = (await (User as any).find(1)) as User | null;
    const all = (await (User as any).all()) as User | null;
  }
}

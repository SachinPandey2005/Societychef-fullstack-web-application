import { Profile } from '../profile';

declare global {
  namespace Express {
    interface Request {
      user?: Profile;
    }
  }
}

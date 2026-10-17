import { CreateUserDto } from './user.dto.js';

// Inherit validation so registration and user creation follow the same rules.
export class RegisterDto extends CreateUserDto {}

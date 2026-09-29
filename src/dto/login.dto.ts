import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsNotEmpty({ message: 'Name is Required' })
    name: string;
  
    @IsString()
    @IsNotEmpty({ message: 'Password is Required' })
    @MinLength(8, { message: 'Password min 8 characters' })
    password: string;
}

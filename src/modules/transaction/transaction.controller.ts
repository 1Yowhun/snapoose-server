import { Controller, Post } from '@nestjs/common';
import { TransactionService } from './transaction.service.js';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {} 

  @Post()
  async payment() {
    
  }
}

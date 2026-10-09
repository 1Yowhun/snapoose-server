export class ApiResponse<T = unknown> {
  constructor(
    public message: string,
    public statusCode: number,
    public data?: T,
  ) {}
}

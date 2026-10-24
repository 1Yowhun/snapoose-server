import {
  isISO8601,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export function IsDateOnOrAfter(
  relatedProperty: string,
  options?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyKey) => {
    registerDecorator({
      name: 'isDateOnOrAfter',
      target: target.constructor,
      propertyName: propertyKey.toString(),
      constraints: [relatedProperty],
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const start = (args.object as Record<string, unknown>)[
            relatedProperty
          ];
          // Let the field validators report missing or malformed dates.
          if (
            typeof value !== 'string' ||
            typeof start !== 'string' ||
            !isISO8601(value, { strict: true, strictSeparator: true }) ||
            !isISO8601(start, { strict: true, strictSeparator: true })
          ) {
            return true;
          }
          return Date.parse(value) >= Date.parse(start);
        },
        defaultMessage: (args: ValidationArguments) =>
          `${args.property} must be on or after ${relatedProperty}`,
      },
    });
  };
}

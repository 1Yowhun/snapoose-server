type TransformInput = { value: unknown };

export const trimString = ({ value }: TransformInput): unknown =>
  typeof value === 'string' ? value.trim() : value;

// Do not coerce empty strings, booleans, arrays, or objects into numbers.
export const toNumber = ({ value }: TransformInput): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return /^-?\d+(?:\.\d+)?$/.test(trimmed) ? Number(trimmed) : value;
};

// Support comma-separated and repeated query parameters. Keep empty entries
// so validation rejects malformed lists instead of silently ignoring them.
export const toArray = ({ value }: TransformInput): unknown => {
  if (typeof value === 'string')
    return value.split(',').map((item) => item.trim());
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown) =>
      typeof item === 'string'
        ? item.split(',').map((part) => part.trim())
        : [item],
    );
  }
  return value;
};

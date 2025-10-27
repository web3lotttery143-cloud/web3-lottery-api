import { GraphQLScalarType, Kind } from 'graphql';
import mongoose from 'mongoose';

export const Decimal128Scalar = new GraphQLScalarType({
  name: 'Decimal',
  description: 'Decimal128 custom scalar type',
  serialize(value) {
    if (value instanceof mongoose.Types.Decimal128) {
      return parseFloat(value.toString());
    }
    return value;
  },
  parseValue(value) {
    return mongoose.Types.Decimal128.fromString(value.toString());
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
      return mongoose.Types.Decimal128.fromString(ast.value.toString());
    }
    return null;
  },
});

export const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    if (value instanceof Date) {
      return value.getTime();
    }
    return null;
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    return null;
  },
});

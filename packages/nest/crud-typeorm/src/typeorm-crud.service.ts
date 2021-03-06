import { QueryFilter as CrudQueryFilter } from '@nestjsx/crud-request';
import { TypeOrmCrudService as BaseTypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { ComparisonOperator, QueryFilter } from '@nestpkg/crud-request';
import { ObjectLiteral } from 'typeorm';

export class TypeOrmCrudService<T> extends BaseTypeOrmCrudService<T> {
  protected mapOperatorsToQuery(
    cond: QueryFilter | CrudQueryFilter,
    param: string
  ): {
    str: string;
    params: ObjectLiteral;
  } {
    // TODO: check for json column metadata cond.field
    // console.log(this.getRelationMetadata(cond.field));
    if (isJsonOperator(cond.operator as ComparisonOperator)) {
      return mapJsonOperatorsToQuery(
        cond as QueryFilter,
        param,
        this.getFieldWithAlias(cond.field)
      );
    } else {
      return super.mapOperatorsToQuery(cond as CrudQueryFilter, param);
    }
  }
}

export function mapJsonOperatorsToQuery(
  cond: QueryFilter,
  param: string,
  field: string
): {
  str: string;
  params: ObjectLiteral;
} {
  let str: string;

  // eslint-disable-next-line no-case-declarations
  const [property, propertyValue] = cond.value.toString().trim().split('$');

  let params: ObjectLiteral = { [param.toString()]: propertyValue };

  const jsonSQL = `JSON_EXTRACT(${field}, "$.${property}")`;

  switch (cond.operator) {
    case '$jsoncont':
      str = `${jsonSQL} LIKE :${param}`;
      params = { [param.toString()]: `%${propertyValue}%` };
      break;
    default:
      str = `${jsonSQL} = :${param}`;
      break;
  }

  return { str, params };
}

// TODO: check for json column metadata cond.field
// console.log(this.getRelationMetadata(cond.field));
export function isJsonOperator(operator: ComparisonOperator): boolean {
  return -1 !== ['$jsoneq', '$jsoncont'].indexOf(operator);
}

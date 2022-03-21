import { parse, print } from "graphql";
import type {
  DocumentNode,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
} from "graphql";

export interface VerificationRule {
  verify(ast: DocumentNode): boolean;
  failMessage: string;
}

export function verifyCode(
  verificationRules: VerificationRule[],
  code: string
): string[] {
  let ast;
  const resultItems = [];
  let thereIsAParseError = false;

  try {
    ast = parse(code);
  } catch (error: any) {
    thereIsAParseError = true;
    resultItems.push(error.message);
  }

  if (!thereIsAParseError) {
    for (const verificationRule of verificationRules) {
      const { verify, failMessage } = verificationRule;
      if (!verify(ast as DocumentNode)) {
        resultItems.push(failMessage);
      }
    }

    if (resultItems.length === 0) {
      resultItems.push("Everything seems fine.");
    }
  }
  return resultItems;
}

export function createVerificationRules(
  graphQLSchema: string
): VerificationRule[] {
  const verificationRules = [];
  const ast = parse(graphQLSchema);
  for (const definition of ast.definitions) {
    if (definition.kind === "ObjectTypeDefinition") {
      const typeName = definition.name.value;
      verificationRules.push(createTypeVerificationRule(typeName));
      if (definition.fields) {
        for (const field of definition.fields) {
          if (field.kind === "FieldDefinition") {
            const fieldName = field.name.value;
            verificationRules.push(
              createFieldVerificationRule(typeName, fieldName)
            );
            verificationRules.push(
              createFieldTypeVerificationRule(
                typeName,
                fieldName,
                print(field.type)
              )
            );
          }
        }
      }
    }
  }
  return verificationRules;
}

export function createTypeVerificationRule(typeName: string): VerificationRule {
  return {
    verify(ast) {
      return Boolean(findTypeDefinition(ast, typeName));
    },
    failMessage: `Type "${typeName}" missing.`,
  };
}

export function createFieldVerificationRule(
  typeName: string,
  fieldName: string
): VerificationRule {
  return {
    verify(ast) {
      const definition = findTypeDefinition(ast, typeName);
      let result;
      if (definition) {
        const field = findFieldDefinition(definition, fieldName);
        result = Boolean(field);
      } else {
        result = false;
      }
      return result;
    },
    failMessage: `On type "${typeName}": field "${fieldName}" missing.`,
  };
}

export function createFieldTypeVerificationRule(
  typeName: string,
  fieldName: string,
  fieldType: string
): VerificationRule {
  return {
    verify(ast) {
      const definition = findTypeDefinition(ast, typeName);
      let result;
      if (definition) {
        const field = findFieldDefinition(definition, fieldName);
        result = Boolean(field && print(field.type) === fieldType);
      } else {
        result = false;
      }
      return result;
    },
    failMessage: `On type "${typeName}": field "${fieldName}" has a different type than "${fieldType}".`,
  };
}

function findTypeDefinition(
  ast: DocumentNode,
  typeName: string
): ObjectTypeDefinitionNode | undefined {
  return ast.definitions.find(
    (definition) =>
      definition.kind === "ObjectTypeDefinition" &&
      definition.name.value === typeName
  ) as ObjectTypeDefinitionNode;
}

function findFieldDefinition(
  definition: ObjectTypeDefinitionNode,
  fieldName: string
): FieldDefinitionNode | undefined {
  return definition.fields?.find(
    (field) =>
      field.kind === "FieldDefinition" && field.name.value === fieldName
  );
}

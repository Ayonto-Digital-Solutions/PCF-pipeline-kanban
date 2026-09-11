export const PRIVILEGE_TYPE = {
  None: 0,
  Create: 1,
  Read: 2,
  Write: 3,
  Delete: 4,
  Assign: 5,
  Share: 6,
  Append: 7,
  AppendTo: 8,
} as const;

export const PRIVILEGE_DEPTH = {
  None: -1,
  Basic: 0,
  Local: 1,
  Deep: 2,
  Global: 3,
} as const;

export type PrivilegeType = (typeof PRIVILEGE_TYPE)[keyof typeof PRIVILEGE_TYPE];
export type PrivilegeDepth = (typeof PRIVILEGE_DEPTH)[keyof typeof PRIVILEGE_DEPTH];

export interface PrivilegeSource {
  readonly getEntityMetadata: (entityName: string) => Promise<unknown>;
  readonly hasEntityPrivilege: (entityName: string, privilegeType: number, privilegeDepth: number) => boolean;
}

export interface PrivilegeService {
  readonly can: (entityName: string, privilegeType: PrivilegeType, privilegeDepth?: PrivilegeDepth) => Promise<boolean>;
  readonly invalidate: () => void;
}

export function createPrivilegeService(source: PrivilegeSource): PrivilegeService {
  const warmed = new Map<string, Promise<void>>();

  function warm(entityName: string): Promise<void> {
    const pending = warmed.get(entityName);
    if (pending !== undefined) {
      return pending;
    }
    const started = source.getEntityMetadata(entityName).then(
      () => undefined,
      () => undefined
    );
    warmed.set(entityName, started);
    return started;
  }

  async function can(
    entityName: string,
    privilegeType: PrivilegeType,
    privilegeDepth: PrivilegeDepth = PRIVILEGE_DEPTH.Basic
  ): Promise<boolean> {
    await warm(entityName);
    return source.hasEntityPrivilege(entityName, privilegeType, privilegeDepth);
  }

  return {
    can,
    invalidate: () => {
      warmed.clear();
    },
  };
}

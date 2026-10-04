declare module 'oracledb' {
  export const OUT_FORMAT_OBJECT: number;
  export const OUT_FORMAT_ARRAY: number;
  export const CLOB: number;
  export const BLOB: number;
  export let autoCommit: boolean;
  export let fetchAsString: number[];
  export let initOracleClient: any;

  export interface PoolAttributes {
    user?: string;
    password?: string;
    connectString?: string;
    poolMin?: number;
    poolMax?: number;
    poolIncrement?: number;
    poolTimeout?: number;
    [key: string]: any;
  }

  export interface ExecuteOptions {
    outFormat?: number;
    autoCommit?: boolean;
    [key: string]: any;
  }

  export interface Result<T = any> {
    rows?: T[];
    rowsAffected?: number;
    outBinds?: any;
    metaData?: any[];
  }

  export type BindParameters = Record<string, any> | any[];

  export interface Connection {
    execute<T = any>(
      sql: string,
      bindParams?: BindParameters,
      options?: ExecuteOptions
    ): Promise<Result<T>>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    close(): Promise<void>;
  }

  export interface Pool {
    getConnection(): Promise<Connection>;
    close(drainTime?: number): Promise<void>;
  }

  export function createPool(attrs: PoolAttributes): Promise<Pool>;
}

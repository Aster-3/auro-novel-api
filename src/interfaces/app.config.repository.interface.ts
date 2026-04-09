import { AppConfig } from "../entities/AppConfig.js";

export interface IAppConfigRepository {
  getConfig(): Promise<AppConfig>;
  updateConfig(config: Partial<AppConfig>): Promise<void>;
}

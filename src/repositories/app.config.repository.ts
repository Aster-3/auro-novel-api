import { Repository } from "typeorm";
import { AppConfig } from "../entities/AppConfig.js";
import { IAppConfigRepository } from "../interfaces/app.config.repository.interface.js";

export class AppConfigRepository implements IAppConfigRepository {
  private cachedConfig: AppConfig | null = null;

  constructor(private configRepo: Repository<AppConfig>) {}

  async getConfig(): Promise<AppConfig> {
    if (this.cachedConfig) return this.cachedConfig;

    let config = await this.configRepo.findOne({ where: { id: 1 } });

    if (!config) {
      config = this.configRepo.create({ id: 1 });
      await this.configRepo.save(config);
    }

    this.cachedConfig = config;
    return config;
  }

  async updateConfig(config: Partial<AppConfig>): Promise<void> {
    const existingConfig = await this.getConfig();
    const mergedConfig = this.configRepo.merge(existingConfig, config);

    this.cachedConfig = await this.configRepo.save(mergedConfig);
  }
}

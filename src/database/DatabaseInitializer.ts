import { ProgressService } from '../services/ProgressService';
import { DatabaseHelper } from './DatabaseHelper';

export class DatabaseInitializer {
  private databaseHelper: DatabaseHelper;

  constructor(progressService: ProgressService) {
    this.databaseHelper = new DatabaseHelper(progressService);
  }

  async initializeDatabase() {
    try {
      await this.databaseHelper.initializeDatabase();
      return this.databaseHelper.getCharacterCount() > 0;
    } catch (error) {
      console.error('Error during database initialization', error);
      return false;
    }
  }

  getDatabaseHelper() {
    return this.databaseHelper;
  }
}

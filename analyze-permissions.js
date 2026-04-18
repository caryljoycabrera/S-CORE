#!/usr/bin/env node

/**
 * S-CORE Permission Model Analyzer
 * Verifies permission safeguards in source code without running tests
 * 
 * Checks:
 * - Middleware protection on sensitive routes
 * - Database query filtering by ownership
 * - Permission checks on CRUD operations
 * - Role-based access control implementation
 */

const fs = require('fs');
const path = require('path');

class PermissionAnalyzer {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.findings = {
      protected: [],
      unprotected: [],
      warnings: [],
      info: []
    };
  }

  /**
   * Read file content
   */
  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      console.error(`❌ Could not read ${filePath}: ${err.message}`);
      return null;
    }
  }

  /**
   * Analyze auth middleware
   */
  analyzeAuthMiddleware() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. AUTHENTICATION MIDDLEWARE ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const authPath = path.join(this.rootDir, 'middleware', 'auth.js');
    const content = this.readFile(authPath);

    if (!content) return false;

    const checks = {
      requireAdmin: { pattern: /function requireAdmin/, found: false },
      requireUnit: { pattern: /function requireUnit/, found: false },
      requireAuth: { pattern: /function requireAuth/, found: false },
      roleCheck: { pattern: /user\.role\s*!==\s*['"]admin['"]/, found: false },
      adminCheck: { pattern: /user\.role !== 'admin'/, found: false },
      unitCheck: { pattern: /user\.role !== 'unit'/, found: false },
      emailVerification: { pattern: /emailVerified/, found: false },
      sessionCheck: { pattern: /req\.session\?\.userId/, found: false }
    };

    Object.entries(checks).forEach(([key, check]) => {
      if (check.pattern.test(content)) {
        console.log(`✅ ${key}: Present`);
        this.findings.protected.push(`Middleware: ${key}`);
        check.found = true;
      } else {
        console.log(`❌ ${key}: Missing`);
        this.findings.unprotected.push(`Middleware: ${key}`);
      }
    });

    const allFound = Object.values(checks).every(c => c.found);
    return allFound;
  }

  /**
   * Analyze admin routes protection
   */
  analyzeAdminRoutes() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2. ADMIN ROUTES PROTECTION ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const adminPath = path.join(this.rootDir, 'routes', 'admin.js');
    const content = this.readFile(adminPath);

    if (!content) return false;

    const adminRoutes = [
      { name: 'Dashboard', pattern: /router\.get\(['"]\/admin['"].*requireAdmin/ },
      { name: 'Update Status', pattern: /router\.post\(['"]\/admin\/.*update-status['"].*requireAdmin/ },
      { name: 'User Update', pattern: /router\.post\(['"]\/admin\/user\/update['"].*requireAdmin/ },
      { name: 'Service Approve', pattern: /router\.post\(['"]\/admin\/.*approve['"].*requireAdmin/ }
    ];

    let protectedCount = 0;
    adminRoutes.forEach(route => {
      if (route.pattern.test(content)) {
        console.log(`✅ ${route.name}: Protected with requireAdmin`);
        this.findings.protected.push(`Admin Route: ${route.name}`);
        protectedCount++;
      } else {
        console.log(`⚠️  ${route.name}: Check manually`);
        this.findings.warnings.push(`Admin Route: ${route.name} needs verification`);
      }
    });

    return protectedCount >= adminRoutes.length - 1;
  }

  /**
   * Analyze unit routes protection
   */
  analyzeUnitRoutes() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3. UNIT ROUTES PROTECTION ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const unitPath = path.join(this.rootDir, 'routes', 'unit.js');
    const content = this.readFile(unitPath);

    if (!content) return false;

    const unitRoutes = [
      { name: 'Dashboard', pattern: /router\.get\(['"]\/unit['"].*requireUnit/ },
      { name: 'Task Approve', pattern: /router\.post\(['"]\/unit\/.*approve['"].*requireUnit/ },
      { name: 'Profile Update', pattern: /router\.post\(['"]\/unit\/profile\/update['"].*requireUnit/ }
    ];

    let protectedCount = 0;
    unitRoutes.forEach(route => {
      if (route.pattern.test(content)) {
        console.log(`✅ ${route.name}: Protected with requireUnit`);
        this.findings.protected.push(`Unit Route: ${route.name}`);
        protectedCount++;
      } else {
        console.log(`⚠️  ${route.name}: Check manually`);
        this.findings.warnings.push(`Unit Route: ${route.name} needs verification`);
      }
    });

    return protectedCount >= unitRoutes.length - 1;
  }

  /**
   * Analyze user routes protection
   */
  analyzeUserRoutes() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4. USER ROUTES PROTECTION ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const userPath = path.join(this.rootDir, 'routes', 'user.js');
    const content = this.readFile(userPath);

    if (!content) return false;

    const userRoutes = [
      { name: 'User Dashboard', pattern: /router\.get\(['"]\/user['"].*requireAuth|requireLogin/ },
      { name: 'Profile', pattern: /router\.get\(['"]\/profile['"].*requireAuth|requireLogin/ },
      { name: 'Create Request', pattern: /router\.post\(['"].*request.*requireAuth|requireLogin/ }
    ];

    let protectedCount = 0;
    userRoutes.forEach(route => {
      if (route.pattern.test(content)) {
        console.log(`✅ ${route.name}: Protected`);
        this.findings.protected.push(`User Route: ${route.name}`);
        protectedCount++;
      } else {
        console.log(`⚠️  ${route.name}: Check manually`);
        this.findings.warnings.push(`User Route: ${route.name}`);
      }
    });

    return protectedCount >= userRoutes.length - 1;
  }

  /**
   * Analyze database query filtering
   */
  analyzeQueryFiltering() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('5. DATABASE QUERY FILTERING ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const userPath = path.join(this.rootDir, 'routes', 'user.js');
    const content = this.readFile(userPath);

    if (!content) return false;

    const filterPatterns = {
      'User ID filters': /userId.*req\.session\.userId|userId:\s*req\.session\.userId/,
      'Session validation': /req\.session\?.userId/,
      'Ownership checks': /req\.user\._id|req\.session\.userId/
    };

    Object.entries(filterPatterns).forEach(([name, pattern]) => {
      if (pattern.test(content)) {
        console.log(`✅ ${name}: Implemented`);
        this.findings.protected.push(`Query Filter: ${name}`);
      } else {
        console.log(`⚠️  ${name}: Verify implementation`);
        this.findings.warnings.push(`Query Filter: ${name}`);
      }
    });

    return true;
  }

  /**
   * Analyze models for data structure safety
   */
  analyzeModels() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('6. DATA MODEL SAFETY ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const models = [
      { name: 'User', file: 'User.js' },
      { name: 'ServiceRequest', file: 'ServiceRequest.js' },
      { name: 'RequestApproval', file: 'RequestApproval.js' }
    ];

    let allGood = true;
    models.forEach(model => {
      const modelPath = path.join(this.rootDir, 'models', model.file);
      const content = this.readFile(modelPath);

      if (!content) return;

      const hasUserId = /userId/.test(content);
      const hasStatus = /status/.test(content);
      const hasValidation = /enum:|required:|default:/.test(content);

      if (hasUserId && hasStatus && hasValidation) {
        console.log(`✅ ${model.name}: Proper structure (userId, status, validation)`);
        this.findings.protected.push(`Model: ${model.name}`);
      } else {
        console.log(`⚠️  ${model.name}: Missing structure elements`);
        this.findings.warnings.push(`Model: ${model.name}`);
        allGood = false;
      }
    });

    return allGood;
  }

  /**
   * Print summary report
   */
  printReport() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  S-CORE PERMISSION MODEL ANALYSIS REPORT                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    const protected_count = this.findings.protected.length;
    const unprotected_count = this.findings.unprotected.length;
    const warning_count = this.findings.warnings.length;

    console.log('\n📊 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Protected/Secure: ${protected_count}`);
    console.log(`❌ Unprotected: ${unprotected_count}`);
    console.log(`⚠️  Warnings: ${warning_count}`);

    if (unprotected_count > 0) {
      console.log('\n❌ UNPROTECTED AREAS (MUST FIX):');
      this.findings.unprotected.forEach(item => console.log(`   • ${item}`));
    }

    if (warning_count > 0) {
      console.log('\n⚠️  WARNINGS (REVIEW MANUALLY):');
      this.findings.warnings.forEach(item => console.log(`   • ${item}`));
    }

    console.log('\n✅ PROTECTED AREAS (SAMPLE):');
    this.findings.protected.slice(0, 10).forEach(item => console.log(`   • ${item}`));
    if (this.findings.protected.length > 10) {
      console.log(`   ... and ${this.findings.protected.length - 10} more`);
    }

    // Final verdict
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (unprotected_count === 0 && warning_count < 3) {
      console.log('✅ PERMISSION MODEL: STRONG');
      console.log('   Most permission checks implemented correctly.');
    } else if (unprotected_count === 0) {
      console.log('⚠️  PERMISSION MODEL: GOOD (WITH NOTES)');
      console.log('   Permission checks present but review warnings above.');
    } else {
      console.log('❌ PERMISSION MODEL: NEEDS WORK');
      console.log('   Unprotected endpoints detected. Fix before production.');
    }

    console.log('\n📋 NEXT STEPS');
    console.log('   1. Review warnings listed above');
    console.log('   2. Run manual browser tests using TESTING_GUIDE_PERMS.md');
    console.log('   3. Verify permission enforcement with test accounts');
    console.log('   4. Check audit logging and notifications');
  }

  /**
   * Run full analysis
   */
  run() {
    console.log('\n🔍 Starting S-CORE Permission Model Analysis...\n');

    const results = {
      auth: this.analyzeAuthMiddleware(),
      admin: this.analyzeAdminRoutes(),
      unit: this.analyzeUnitRoutes(),
      user: this.analyzeUserRoutes(),
      queries: this.analyzeQueryFiltering(),
      models: this.analyzeModels()
    };

    this.printReport();

    const allPassed = Object.values(results).every(r => r === true);
    console.log(`\n${allPassed ? '✅' : '⚠️ '} Analysis complete.\n`);

    return allPassed ? 0 : 1;
  }
}

// Run analyzer
const rootDir = __dirname;
const analyzer = new PermissionAnalyzer(rootDir);
const exitCode = analyzer.run();
process.exit(exitCode);

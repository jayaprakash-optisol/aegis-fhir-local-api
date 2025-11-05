# Project Architecture

This document describes the folder structure and architectural decisions for this NestJS project.

## Folder Structure

```
src/
├── app.module.ts           # Root application module
├── main.ts                 # Application entry point
├── common/                 # Shared functionality across modules
│   ├── decorators/         # Custom decorators (e.g., @Roles)
│   ├── guards/             # Authentication & authorization guards
│   ├── strategies/         # Passport strategies (JWT, OAuth, etc.)
│   ├── enums/              # Shared enumerations
│   ├── types/              # Shared TypeScript types/interfaces
│   └── index.ts            # Barrel export for cleaner imports
├── config/                 # Configuration modules
│   └── database/           # Database configuration (Prisma)
│       ├── prisma.module.ts
│       ├── prisma.service.ts
│       └── index.ts
└── modules/                # Feature modules
    ├── auth/               # Authentication module
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.module.ts
    │   └── dto/            # Data Transfer Objects
    │       ├── login.dto.ts
    │       └── register.dto.ts
    └── data-scientist/     # Data scientist feature module
        ├── data-scientist.controller.ts
        └── data-scientist.module.ts
```

## Architecture Principles

### 1. Separation of Concerns

- **common/**: Contains shared utilities used across multiple modules (guards, decorators, strategies)
- **config/**: Contains configuration-related modules (database, caching, etc.)
- **modules/**: Contains feature-specific modules organized by domain

### 2. Module Organization

Each feature module follows this structure:

- `*.module.ts` - Module definition
- `*.controller.ts` - HTTP route handlers
- `*.service.ts` - Business logic
- `dto/` - Data Transfer Objects for validation and type safety

### 3. Barrel Exports

Each directory contains an `index.ts` file for cleaner imports:

```typescript
// Instead of:
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

// You can use:
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
```

### 4. Guards & Decorators

Guards and decorators are centralized in the `common/` directory since they're used across multiple modules:

- `JwtAuthGuard` - JWT authentication
- `RolesGuard` - Role-based authorization
- `@Roles()` - Role decorator for endpoint protection

### 5. Database Configuration

Prisma configuration is stored in `config/database/` rather than as a top-level module, making it clear it's a configuration concern.

## Import Guidelines

### Recommended Import Patterns

```typescript
// ✅ Good: Use barrel exports
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';

// ✅ Good: Relative imports for module-specific files
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

// ❌ Avoid: Direct file imports when barrel exports exist
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
```

## Adding New Features

### Creating a New Module

1. Create a new directory under `src/modules/`:

   ```bash
   mkdir -p src/modules/my-feature
   ```

2. Add the module structure:

   ```
   src/modules/my-feature/
   ├── my-feature.module.ts
   ├── my-feature.controller.ts
   ├── my-feature.service.ts
   └── dto/
       └── create-my-feature.dto.ts
   ```

3. Import the module in `app.module.ts`:
   ```typescript
   import { MyFeatureModule } from './modules/my-feature/my-feature.module';
   ```

### Adding Shared Utilities

If you need to add shared functionality:

- **Guards** → `src/common/guards/`
- **Decorators** → `src/common/decorators/`
- **Strategies** → `src/common/strategies/`
- **Enums** → `src/common/enums/`
- **Types/Interfaces** → `src/common/types/`

Remember to update the corresponding `index.ts` file for barrel exports.

## Benefits of This Structure

1. **Scalability**: Easy to add new modules without cluttering the root directory
2. **Maintainability**: Clear separation between shared utilities and feature-specific code
3. **Discoverability**: Developers can quickly find related code
4. **Testability**: Isolated modules are easier to test
5. **Clean Imports**: Barrel exports reduce import statement verbosity

## Migration Notes

This structure was refactored from a flat organization to improve code organization and maintainability. All existing functionality remains intact; only file locations have changed.

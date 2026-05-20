# Setup script for AgriConnect
cd d:\dev\kodeacross\agriconnect
npm install @nx/nest @nx/js --save-dev
npx nx g @nx/nest:app api-gateway --directory=apps/api-gateway --projectNameAndRootFormat=as-provided --interactive=false --e2eTestRunner=none
npx nx g @nx/js:library shared-types --directory=libs/shared-types --projectNameAndRootFormat=as-provided --interactive=false
npx nx g @nx/nest:library shared-database --directory=libs/shared-database --projectNameAndRootFormat=as-provided --interactive=false
npx nx g @nx/js:library shared-utils --directory=libs/shared-utils --projectNameAndRootFormat=as-provided --interactive=false
npm install typeorm @nestjs/typeorm pg redis socket.io @nestjs/platform-socket.io @nestjs/core @nestjs/common @nestjs/websockets @socket.io/redis-adapter ioredis class-validator class-transformer

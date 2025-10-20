# Руководство по развёртыванию

Это руководство описывает процесс развёртывания Guitar Pro Clone на различных платформах.

## 📋 Предварительные требования

- Node.js 18+ и npm
- Git (для version control)
- Учётная запись на выбранной платформе хостинга

## 🚀 Сборка для продакшена

### Шаг 1: Подготовка проекта

```bash
# Убедитесь, что все зависимости установлены
npm install

# Запустите тесты
npm test

# Проверьте линтинг
npm run lint
```

### Шаг 2: Сборка

```bash
# Продакшен сборка с оптимизацией
npm run build

# Или с указанием конфигурации
ng build --configuration production
```

Результат будет в директории `dist/alphatab-app/`.

### Шаг 3: Проверка сборки локально

```bash
# Установите http-server (если еще не установлен)
npm install -g http-server

# Запустите локальный сервер
cd dist/alphatab-app
http-server -p 8080

# Откройте http://localhost:8080
```

## ☁️ Развёртывание на различных платформах

### Vercel

Самый простой способ развернуть Angular приложение.

#### Через CLI

```bash
# Установите Vercel CLI
npm install -g vercel

# Войдите в аккаунт
vercel login

# Деплой
vercel

# Продакшен деплой
vercel --prod
```

#### Через GitHub Integration

1. Создайте репозиторий на GitHub
2. Push вашего кода:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
3. Перейдите на [vercel.com](https://vercel.com)
4. Нажмите "New Project"
5. Импортируйте ваш GitHub репозиторий
6. Vercel автоматически определит Angular и настроит сборку

**Конфигурация `vercel.json`:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/alphatab-app"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

### Netlify

Еще одна отличная платформа для статических сайтов.

#### Через CLI

```bash
# Установите Netlify CLI
npm install -g netlify-cli

# Войдите в аккаунт
netlify login

# Инициализация
netlify init

# Деплой
netlify deploy

# Продакшен деплой
netlify deploy --prod
```

#### Через GitHub Integration

1. Push вашего кода на GitHub
2. Перейдите на [netlify.com](https://netlify.com)
3. Нажмите "New site from Git"
4. Выберите ваш репозиторий
5. Настройте:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/alphatab-app`
6. Нажмите "Deploy site"

**Конфигурация `netlify.toml`:**

```toml
[build]
  command = "npm run build"
  publish = "dist/alphatab-app"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### GitHub Pages

Бесплатный хостинг от GitHub.

#### Настройка

```bash
# Установите angular-cli-ghpages
npm install -g angular-cli-ghpages

# Сборка с правильным base-href
ng build --base-href "https://<username>.github.io/<repository>/"

# Деплой
npx angular-cli-ghpages --dir=dist/alphatab-app
```

#### Автоматический деплой через GitHub Actions

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build -- --base-href "https://<username>.github.io/<repository>/"
    
    - name: Deploy
      uses: JamesIves/github-pages-deploy-action@4.1.5
      with:
        branch: gh-pages
        folder: dist/alphatab-app
```

---

### Firebase Hosting

Хостинг от Google с отличной производительностью.

#### Настройка

```bash
# Установите Firebase CLI
npm install -g firebase-tools

# Войдите в аккаунт
firebase login

# Инициализация
firebase init hosting

# Выберите:
# - Создать новый проект или выбрать существующий
# - Public directory: dist/alphatab-app
# - Configure as single-page app: Yes
# - Set up automatic builds with GitHub: Yes (опционально)

# Сборка
npm run build

# Деплой
firebase deploy
```

**Конфигурация `firebase.json`:**

```json
{
  "hosting": {
    "public": "dist/alphatab-app",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(woff|woff2|ttf|sf2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

---

### AWS S3 + CloudFront

Профессиональное решение для больших проектов.

#### Настройка S3

1. Создайте S3 bucket
2. Включите static website hosting
3. Настройте bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

#### Деплой

```bash
# Установите AWS CLI
# https://aws.amazon.com/cli/

# Конфигурация
aws configure

# Сборка
npm run build

# Синхронизация с S3
aws s3 sync dist/alphatab-app/ s3://your-bucket-name --delete

# Инвалидация CloudFront кеша (если используете)
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Автоматизация с GitHub Actions

```yaml
name: Deploy to AWS S3

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Deploy to S3
      run: aws s3 sync dist/alphatab-app/ s3://your-bucket-name --delete
```

---

### Docker

Контейнеризация для любого окружения.

#### Создайте `Dockerfile`:

```dockerfile
# Stage 1: Build
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/dist/alphatab-app /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Создайте `nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кеширование статических файлов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|sf2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip компрессия
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
}
```

#### Сборка и запуск:

```bash
# Сборка образа
docker build -t guitarpro-clone .

# Запуск контейнера
docker run -d -p 8080:80 guitarpro-clone

# Приложение доступно на http://localhost:8080
```

#### Docker Compose:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

Запуск: `docker-compose up -d`

---

## 🔧 Оптимизации для продакшена

### 1. Включение продакшен режима

В `angular.json` убедитесь, что конфигурация `production` включает:

```json
{
  "configurations": {
    "production": {
      "optimization": true,
      "outputHashing": "all",
      "sourceMap": false,
      "namedChunks": false,
      "extractLicenses": true,
      "vendorChunk": false,
      "buildOptimizer": true,
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "2mb",
          "maximumError": "5mb"
        }
      ]
    }
  }
}
```

### 2. Сжатие файлов

#### Gzip (nginx):

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript 
           application/x-javascript application/xml+rss 
           application/javascript application/json;
```

#### Brotli (если поддерживается):

```nginx
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css text/xml text/javascript 
             application/x-javascript application/xml+rss 
             application/javascript application/json;
```

### 3. Кеширование

#### Заголовки кеширования:

```nginx
# Неизменяемые файлы (с хешами в имени)
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML файлы (не кешируем)
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### 4. CDN

Использование CDN для статических файлов:

```typescript
// angular.json
{
  "configurations": {
    "production": {
      "deployUrl": "https://cdn.yoursite.com/"
    }
  }
}
```

### 5. Lazy Loading

Для больших приложений используйте lazy loading модулей:

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'settings',
    loadComponent: () => import('./components/settings-panel/settings-panel.component')
      .then(m => m.SettingsPanelComponent)
  }
];
```

## 📊 Мониторинг

### Google Analytics

Добавьте в `src/index.html`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Sentry (мониторинг ошибок)

```bash
npm install @sentry/angular
```

```typescript
// src/main.ts
import * as Sentry from "@sentry/angular";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});
```

## 🔒 Безопасность

### Content Security Policy

Добавьте в `src/index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               font-src 'self' data:; 
               media-src 'self' data:;">
```

### HTTPS

Всегда используйте HTTPS в продакшене. Большинство платформ (Vercel, Netlify) предоставляют его автоматически.

## ✅ Чеклист перед деплоем

- [ ] Все тесты проходят (`npm test`)
- [ ] Нет ошибок линтера (`npm run lint`)
- [ ] Продакшен сборка работает локально
- [ ] Проверены все роуты
- [ ] Настроены переменные окружения
- [ ] Добавлен файл `robots.txt`
- [ ] Добавлен `sitemap.xml`
- [ ] Настроена аналитика
- [ ] Проверена производительность (Lighthouse)
- [ ] Протестировано на мобильных устройствах
- [ ] Настроен мониторинг ошибок

## 🆘 Решение проблем

### Проблема: "Cannot find module 'AlphaTab'"

**Решение:** Убедитесь, что AlphaTab установлен:
```bash
npm install @coderline/alphatab
```

### Проблема: Не загружаются шрифты/soundfont

**Решение:** Проверьте пути в конфигурации:
```typescript
{
  core: {
    fontDirectory: '/font/',  // Должна быть в public/font/
  },
  player: {
    soundFont: '/soundfont/sonivox.sf2'  // Должен быть в public/soundfont/
  }
}
```

### Проблема: Routing не работает на продакшене

**Решение:** Настройте перенаправления на `index.html` (см. конфигурации выше для каждой платформы).

## 📞 Поддержка

Если возникли проблемы с развёртыванием:
1. Проверьте документацию платформы хостинга
2. Создайте issue в репозитории
3. Проверьте логи сборки и деплоя

---

**Удачного деплоя! 🚀**


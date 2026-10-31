# local-operator-docs production image.
#
# Same shape as radient-docs: the prebuild scripts generate the version manifest
# and search index, and the design-system check gates the build.
# Node 24 LTS at the patch the whole estate runs (see
# scripts/check-node-versions.sh). This image is built by the same rail as the
# Radient services, so it moves with them; the app repository's .nvmrc is a
# separate change owned by that repository and is not compared from here.
FROM node:24.22.1-bookworm-slim

# pnpm is installed at the version the lockfile was written with instead of
# through corepack: the corepack bundled in these Node images cannot verify the
# registry's current signing key ("Cannot find matching keyid"), which failed
# every Node image build on the first attempt. A pinned npm install is
# reproducible and does not depend on corepack's key list.
RUN npm install -g pnpm@12.6.0

# Evidence AND assertion: the build log names the runtime, and the build
# fails if this base image ever supplies a different one. The app repos' engine
# guard cannot do this -- their .npmrc arrives after the install layer.
RUN node --version && test "$(node --version)" = "v24.22.1"

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

CMD ["pnpm", "start"]

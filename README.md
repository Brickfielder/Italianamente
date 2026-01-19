This is a [Tina CMS](https://tina.io/) project.

## Local Development

Install the project's dependencies:

> [!NOTE]  
> [Do you know the best package manager for Node.js?](https://www.ssw.com.au/rules/best-package-manager-for-node/) Using the right package manager can greatly enhance your development workflow. We recommend using pnpm for its speed and efficient handling of dependencies. Learn more about why pnpm might be the best choice for your projects by checking out this rule from SSW.

```
pnpm install
```

Run the project locally:

```
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building the Starter Locally (Using the hosted content API)

Copy `.env.example` to `.env` and fill in the required values.

```
NEXT_PUBLIC_TINA_CLIENT_ID=<get this from the project you create at app.tina.io>
TINA_TOKEN=<get this from the project you create at app.tina.io>
NEXT_PUBLIC_TINA_BRANCH=<Specify the branch with Tina configured>
```

Build the project:

```bash
pnpm build
```

### Tina schema change workflow

When you update the Tina schema:

1. Update `tina/config.js`.
2. Regenerate Tina artifacts locally:
   ```bash
   pnpm build-local
   ```
3. Commit the updated `tina/__generated__` artifacts.
4. Push to the branch connected to TinaCloud so indexing uses the latest schema.

### Image handling

See [`docs/images.md`](docs/images.md) for where originals live and how to embed images so Next.js can serve responsive sizes.

## Learn More

To learn more about Tina, take a look at the following resources:

- [Tina Docs](https://tina.io/docs)
- [Getting started](https://tina.io/docs/setup-overview/)

You can check out [Tina Github repository](https://github.com/tinacms/tinacms) - your feedback and contributions are welcome!

## [Deploy on Vercel](https://tina.io/guides/tina-cloud/add-tinacms-to-existing-site/deployment/)

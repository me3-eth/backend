# me3 Backend

This is a serverless function, running on Netlify, that is used to deploy webpages to IPFS using [web3.storage](https://web3.storage/).

![New site publishing flow](docs/backend-new-site.png)

Content:

* [Setup](#setup)
* [Deploy](#deploy)
* Functions:
  * [ipfs-deploy](/functions/ipfs-deploy/README.md)
  * [ipns-update](/functions/ipns-update/README.md)

## Setup

1. Clone the project and switch to _backend_
    ```sh
    git clone https://github.com/me3-eth/backend.git me3-eth-backend
    cd me3-eth-backend
    ```
2. Optional: set node version with NVM
    ```sh
    nvm use
    ```
3. Install dependencies
    ```sh
    npm install
    ```
4. Create environment file
    ```sh
    touch .env
    ```
5. Fill in environment value with template and your data
    ```sh
    # Get an API key from https://www.alchemy.com/
    ALCHEMY_API_KEY=
    
    # Force node 14
    AWS_LAMBDA_JS_RUNTIME=nodejs14.x
    NODE_VERSION=14
    
    # Get an API key from https://web3.storage/
    WEB3_STORAGE_API_KEY=
    ```

## Deploy

In production, the function is automatically built and deployed by Netlify on pushes to `main`.

On localhost, the function can be run in dev mode using [Netlify Dev](https://www.netlify.com/products/dev/).

```sh
npm run dev
```

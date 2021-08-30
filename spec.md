# Distribution Spec

So we need to get around 50MB repl db limit. One way to do this is to have a sample repl anyone can fork, and upon doing so and running it always on/uptime robot, it automatically ties into the network.

## Key Gen
One thing we need is a key pair system to keep things secure, but how to make these is the question. Auth system similar to RPTPN actually might work:

1. Forked repl connects to cnnd.fun api asking for an api key in a request.
2. cnnd.fun generates a key, sends it back IN A SEPARATE REQUEST (to avoid impersonation attacks), and then stores the key in it's repl db.
3. The storage repl hashes the token before storing it in it's db.

## Image Uploading
Instead of storing an uploaded image in it's own db, a random storage repl is chosen to send to. This is how it works:

1. The storage repl is pinged to make sure its up (something like returning `up` to a GET request at `/` works)
2. The image data, in base64, is then uploaded to the resulting repl. The token is included as a header named `token`, and the image id/slug/name is included as well in the header `image_id`.
3. Storage repl makes sure the token is gucci, and then stores the repl in the db with image_id as the key and the image data as the data.
4. The main repl then stores where the image went inside of its db, though there is probably a better way to do this and not go over the replit key limit.

## New Image ID/Token Generation and image location storage
Instead of storing a key for each image in the main repl, instead have the image id be `{storage_repl_owner_username}_{image_id}`, with the owner of the resulting storage repl's username being storage_repl_owner_username. This means when an image is retrieved, a db lookup is not needed, and instead the repl just needs to fetch and return the image from the storage repl.

## Conclusion
This probably makes no sense to some people, but trust me it'll work lmao
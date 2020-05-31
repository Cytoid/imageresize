const http = require('http');
const https = require('https');
const
{
	URL
} = require('url');

const gm = require('gm').subClass(
{
	imageMagick: true
});

const bucketName = process.env.BUCKET_NAME || 'assets.cytoid.io';

function requestURLForPath(url)
{
	let path = url.pathname;
	if (path.startsWith('/'))
	{
		path = path.substr(1);
	}
	return `https://www.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media`;
}

function requestListener(req, res)
{

	res.setHeader('X-Powered-By', 'cytoid');
	if (req.method !== 'GET')
	{
		res.writeHead(405);
		res.end('Method not allowed');
	}
	const url = new URL(req.url, 'https://images.cytoid.io');
	const request = https.get(requestURLForPath(url), (response) =>
	{
		if (response.statusCode === 200)
		{
			// Image exists.
			const contentType = response.headers['content-type'];
			res.setHeader('content-type', contentType);
			if (!contentType.startsWith('image/')) {
				res.writeHead(response.statusCode);
				response.pipe(res);
				return;
			}

			// Copy headers
			for (const headerName of ['expires', 'etag', 'content-disposition', 'date', 'vary']) {
				const header = response.headers[headerName];
				if (header)
					res.setHeader(headerName, header);
			}
			res.setHeader('cache-control', 'max-age=3153600,public');


			let height = url.searchParams.get('h');
			if (height) height = parseInt(height) || null;
			let width = url.searchParams.get('w');
			if (width) width = parseInt(width) || null;

			res.writeHead(response.statusCode);

			if (height && width)
			{
				gm(response)
					.resize(width, height, '^')
					.gravity('Center')
					.crop(width, height)
					.stream()
					.pipe(res);
			} else if (height || width) {
				gm(response)
					.resize(width, height)
					.stream()
					.pipe(res);
			}
			else
			{
				response.pipe(res);
			}

		}
		else
		{
			// Error
			for (const headerName of ['content-type', 'expires', 'etag', 'content-disposition', 'date', 'vary']) {
				const header = response.headers[headerName];
				if (header)
					res.setHeader(headerName, header);
			}
			res.writeHead(response.statusCode);
			response.pipe(res);
		}
	});
}

const port = process.env.PORT || 8040;
const server = http.createServer(requestListener);
server.listen(port, '0.0.0.0', () =>
{
	console.log('Server listening on ' + port);
});
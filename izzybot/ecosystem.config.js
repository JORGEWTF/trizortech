module.exports = {
    apps: [
        {
            name: 'izzybot',
            script: './index.js',
            cwd: '/var/www/trizortech/izzybot',
            watch: false,
            restart_delay: 5000,
            max_restarts: 10,
            env: {
                NODE_ENV: 'production',
            },
            // Logs
            out_file: '/var/log/izzybot/out.log',
            error_file: '/var/log/izzybot/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
        }
    ]
};

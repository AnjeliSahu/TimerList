<?php
// api.php
class FileMakerAPI {
    private $config;
    private $token;

    public function __construct() {
        $this->config = [
            'server' => 'https://172.16.8.104',
            'database' => 'TimeTracker',
            'username' => 'admin',
            'password' => 'Anjeli',
        ];
    }

    public function authenticate() {
        $url = rtrim($this->config['server'], '/') . "/fmi/data/v1/databases/" . urlencode($this->config['database']) . "/sessions";

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => '{}',
            CURLOPT_USERPWD => "{$this->config['username']}:{$this->config['password']}",
            CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
            CURLOPT_HTTPHEADER => [
                "Content-Type: application/json",
                "Accept: application/json"
            ],
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);
        $this->token = $data['response']['token'] ?? null;
        return $this->token !== null;
    }

    public function getRecords($layout = 'Timer') {
        if (!$this->token && !$this->authenticate()) {
            return ['error' => 'Authentication failed'];
        }

        $url = rtrim($this->config['server'], '/') . "/fmi/data/v1/databases/" . urlencode($this->config['database']) . "/layouts/" . urlencode($layout) . "/records";

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$this->token}",
                "Content-Type: application/json",
                "Accept: application/json"
            ],
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);
        return $data['response']['data'] ?? [];
    }
}
?>

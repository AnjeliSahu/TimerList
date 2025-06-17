<?php
// test.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'api.php'; // Include the FileMakerAPI class

try {
    $api = new FileMakerAPI();
    $data = $api->getRecords();

    if (isset($data['error'])) {
        echo json_encode([
            'success' => false,
            'error' => $data['error']
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $timers = [];
    foreach ($data as $record) {
        $f = $record['fieldData'];
        $timers[] = [
            'userName'   => trim($f['UserName'] ?? ''),
            'project'    => trim($f['ProjectName'] ?? ''),
            'activity'   => trim($f['Activity'] ?? ''),
            'task'       => trim($f['Task'] ?? ''),
            'startTime'  => trim($f['StartTime'] ?? ''),
            'endTime'    => trim($f['EndTimestamp'] ?? ''),
            'duration'   => trim($f['Durations'] ?? '')
        ];
    }

    // Sort by username (A-Z), then by start time (ascending)
    usort($timers, function($a, $b) {
        $userComparison = strcasecmp($a['userName'], $b['userName']);
        if ($userComparison === 0) {
            return strcmp($a['startTime'], $b['startTime']);
        }
        return $userComparison;
    });

    echo json_encode([
        'success' => true,
        'count' => count($timers),
        'timers' => $timers
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>

import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchList2() {
    try {
        const res = await fetch(`${dir}/_demonlist.json`);
        const list = await res.json();

        return list.map(level => [
            {
                ...level,
                records: level.records ? level.records.sort((a, b) => b.percent - a.percent) : []
            },
            null
        ]);
    } catch (err) {
        console.error("Failed to load list2:", err);
        return null;
    }
}


export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();

    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err || !level) {
            errs.push(err || `Unknown level at rank ${rank + 1}`);
            return;
        }

        // --- Sicherstellen, dass verifier existiert ---
        const verifierName = level.verifier ? level.verifier.toLowerCase() : null;

        const verifier =
            Object.keys(scoreMap).find(
                (u) => verifierName && u.toLowerCase() === verifierName
            ) || level.verifier || "Unknown";

        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };

        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name || `Unnamed Level ${rank + 1}`,
            score: score(rank + 1, 100, level.percentToQualify || 100),
            link: level.verification || "",
        });

        // --- Records ---
        if (Array.isArray(level.records)) {
            level.records.forEach((record) => {
                const userName = record.user ? record.user.toLowerCase() : null;

                const user =
                    Object.keys(scoreMap).find(
                        (u) => userName && u.toLowerCase() === userName
                    ) || record.user || "Unknown";

                scoreMap[user] ??= {
                    verified: [],
                    completed: [],
                    progressed: [],
                };

                const { completed, progressed } = scoreMap[user];
                if (record.percent === 100) {
                    completed.push({
                        rank: rank + 1,
                        level: level.name || `Unnamed Level ${rank + 1}`,
                        score: score(rank + 1, 100, level.percentToQualify || 100),
                        link: record.link || "",
                    });
                } else {
                    progressed.push({
                        rank: rank + 1,
                        level: level.name || `Unnamed Level ${rank + 1}`,
                        percent: record.percent || 0,
                        score: score(
                            rank + 1,
                            record.percent || 0,
                            level.percentToQualify || 100
                        ),
                        link: record.link || "",
                    });
                }
            });
        }
    });


    // --- Ergebnisse zusammenbauen ---
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    return [res.sort((a, b) => b.total - a.total), errs];
}

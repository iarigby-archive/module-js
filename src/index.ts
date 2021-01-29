import {setEnv, testerPath, config} from './config'

const {hw, slice, download, runOpts} = setEnv()
import {getSubmissions, Submission, Drive, downloadZip, createDrive} from '../../classroom-api'
import {Result, WebTester} from 'website-tester'
import {Run, log} from './runs'
import {partitionResults} from './partitions'
import fs from 'fs'
import unzipper from 'unzipper'

const testPath = testerPath(hw.id)
const tester = new WebTester(testPath)
const run = new Run(hw, runOpts)

async function main() {
    const drive = await createDrive()
    const submissions = await getSubmissions(config.subject, hw.name)
        .then(submissions => slice ? submissions.slice(0, slice) : submissions)
        .then(submissions => submissions
            .filter(s => !hw.skip?.includes(s.emailId) && (run.forceCheck(s) || run.newSubmission(s))))
        .then(s => log(s, `downloading ${s.filter(e => e.onTime()).length}`))
    //  .then(submissions => submissions.map((s, i) => downloadAndTest(s, drive, i)))
    const results = []
    // ew ew ew
    // Promise.map iS nOt A fUnCtIoN
    let i = 0
    for (let submission of submissions) {
        i++
        console.log(`submission ${i} of ${submissions.length}`)
        try {
            results.push(await downloadAndTest(submission, drive))
        } catch(e) {
            logError(submission, e)
        }
    }
    const output = partitionResults(results, hw)

    run.saveRunInfo(output)
    tester.finish()
}


function downloadAndTest(submission: Submission, drive: Drive): Promise<Submission> {
    if (!run.forceCheck(submission) && !submission.qualifies()) {
        return new Promise(r => r(submission))
    }
    const id = submission.emailId
    return downloadAtInterval(submission, drive)
        .then((e: string) => log(e, `${id}: finished downloading`))
        .then(newPath => unzipSubmission(submission, newPath))
        .then((dir: string) => tester.testSubmission(dir, true, ['index', 'login', 'register']))
        .catch(e => [zipError(e)])
        .then((r: Result[]) => log(r, `${id}: finished testing`))
        .then((results: Result[]) => submission.addResults(results))
        .then(s => calculateScore(s))
        .then(s => log(s, `${id}: ${submission.score}`))
        .catch((error: any) => logError(submission, error))
}

function getScore(r: Result): number {
    // აუ ფუ
    if (r.score) {
        return r.passed ? r.score : 0
    }
    return 0
}
function calculateScore(s: Submission): Submission {
    s.score = s.results.map(getScore).reduce((a, b) => a + b, 0)
    return s
}
function zipError(e: any): Result {
    console.log(e)
    console.log("error during unzip")
    return {
        error: true,
        message: 'დავალების ფაილები ვერ მოიძებნა. გაეცანით დაზიპვის ინსტრუქციებს. https://iarigby.github.io/freeuni-digital-technologies/info/browser_IDE'
    }
}

function unzipSubmission(submission: Submission, path: string): Promise<string> {
    const dir = `${run.moveDir}/${submission.emailId}`
    try {
        fs.mkdirSync(dir)
    } catch (w) {
    }
    return fs.createReadStream(path)
        .pipe(unzipper.Extract({path: dir}))
        .promise()
        .then(() => findRootFile(dir))
}

function findRootFile(dir: string): string {
    // noinspection SpellCheckingInspection
    const miscdirs = ['__MACOSX', '.DS_STORE']
    let p = dir
    let files = fs.readdirSync(p)
    let tries = 0
    while (!files.includes('index.html')) {
        if (tries > 3) {
            throw "homework files not found"
        }
        const filtered = files.filter(e => !miscdirs.includes(e.toUpperCase()))
        try {
            p = `${p}/${filtered[0]}`
            files = fs.readdirSync(p)
        } catch (e) {
            throw "file with unsupported format: " + filtered[0]
        }

        tries++

    }
    return p
}


function downloadAtInterval(submission: Submission, drive: Drive): Promise<string> {
    const attachment = submission.attachment!
    const fileName = attachment.title.includes(submission.emailId) ? attachment.title : submission.emailId + '.download'
    const id = attachment.id
    const path = `${run.moveDir}/${fileName}`
    return new Promise((resolve) => {
        // setTimeout(() => {
            if (download) {
                console.log(`${submission.emailId}: downloading`)
                downloadZip(drive, id, path)
                    .then(() => resolve(path))
            } else {
                resolve(path)
            }
        // }, (index) * 200)
    })
}

function logError(submission: Submission, error: any) {
    submission.results.push({
        error: true,
        message: "crash",
        details: error
    })
    log({}, `error: ${submission.emailId}, ${error}`)
    submission.crashed = true
    return submission
}

main()

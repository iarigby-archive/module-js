import { Partitions } from "./partitions";
import { Submission, getStudentByEmail } from "classroom-api";
import { getArgs } from './config'
const {hw} = getArgs()

type S = Submission
const urls = {
    homework:'https://classroom.google.com/c/NTM3MTA4ODI1ODJa/p/NjM0OTE0NDQyNDZa/details',
    karelFile: 'https://classroom.google.com/c/NTM3MTA4ODI1ODJa/m/NTYyMjI2Nzg5MTRa/details'
}

function fileInfo(s: S) {
    return `
    ქვემოთ ბმულები სტუდენტისთვის არ არის. 
    დავალების ნახვა კლასრუმზე: ${s.alternateLink.replace(/\.com\/c\//, '.com/u/2/c/')} 
    გადმოწერა: ${s.attachment!.downloadUrl.replace(/authuser=0/, 'authuser=2')}
    `
}
/*
const blocked = 'ამ პრობლემის გამო დავალება ტესტირების შემდეგ ნაბიჯზე ვერ გადადის და სხვა შეცდომების არსებობა ცნობილი არ არის. თუ დედლაინამდე დრო დარჩა, შეგიძლია თავიდან ატვირთო. \
            \
            წარმატებები!'
 */
const blocked = ''

let [earlySuccess, earlyFail, moduleEnd]= ['', '','']
// earlySuccess = `, თან დედლაინამდე ამდენი დღით ადრე. ძალიან მაგარია რომ ასეთი მონდომებით სწავლობ კოდის წერას` //
// earlyFail = `ძალიან მაგარია, რომ ასე ადრე დაიწყე დავალების გაკეთება. ამ გადაწყვეტილების წყალობით კიდევ უამრავი დრო გაქვს რამდენიმე ხარვეზის გამოსასწორებლად. `
if (hw.id.includes('bonus')) {
    moduleEnd = `გილოცავ კარელის ბოლო დავალების წარმატებით ჩაბარებას! წარმატებები საგნის დანარჩენ ნაწილებზეც :)`
} else {
    // moduleEnd = `გილოცავ ამდენი ამოცანის წარმატებით ამოხსნას.`
}
export const templates: Partitions<(s: S) => string> | any = {
    late: (s: S) => `
        გამარჯობა ${getStudentByEmail(s.emailId)?.georgianName},

        დავალება დაგვიანებით ატვირთე და ქულა არ ჩაგეთვლება, მაგრამ უკუკავშირის მიზნით გიგზავნი შედეგს:

        ${s.results}
        
        ია
        
        ${fileInfo(s)}
    `,
    invalid: (s: S) => `
        გამარჯობა ${getStudentByEmail(s.emailId)?.georgianName},

        ${earlyFail}დავალების ფაილს არასწორი სახელი აქვს. ფაილის სახელში ვერ მოიძებნა '${s.emailId}.k' და/ან არის არანებადართული სიმბოლოები. დავალების სახელის დარქმევის წესი 
        ${urls.homework}    

        ${s.results}

        ${blocked}

        ია
        
        ${fileInfo(s)}
    `,
    error: (s: S) => `
        გამარჯობა ${getStudentByEmail(s.emailId)?.georgianName},

        ${s.results}

        ${blocked}

        ია
        
        ${fileInfo(s)}
    `,
    failed: (s: S) => `
        გამარჯობა ${getStudentByEmail(s.emailId)?.georgianName},
        
        გიგზავნი პროექტის შედეგებს. სულ დააგროვე ${s.score}

        ${s.results}

        დავალების წარმატებით ჩაბარებასთან ახლოს, ხარ, თუ დედლაინამდე დრო დარჩა, შეგიძლია თავიდან ატვირთო. წარმატებები!

        ია
        
        ${fileInfo(s)}
    `,
    passed: (s: S) => `
        გამარჯობა ${getStudentByEmail(s.emailId)?.georgianName},

        შენმა კოდმა სრულყოფილად გაართვა დავალებას თავი${earlySuccess}.  ${moduleEnd}

        ია
        
        ${fileInfo(s)}
    `

}

export function tempTemplate(s: Submission) {
    return `
      გამარჯობა ${getStudentByEmail(s.emailId)?.georgianName}, 

ფინალურ პროექტში შენ აიღე ${s.score} ქულა 40-დან. გაითვალისწინე, რომ აქ არ შედის ტესტერის ბაგის პოვნის ან დიზაინის ბონუსი. მათი შეფასებები მოგივა დავალებების საბოლოო ქულასთან ერთად (ვინც მომწერეთ ჩანიშნული მაქვს). 

გაითვალისწინე, რომ გამოგზავნილი კოდი ჯერ არ შემომწებულა პლაგიატსა და ტესტების შეცვლის მცდელობაზე. 
- დავალება არ ჩაითვლება, თუ კოდის ცვილელებების მნიშვნელოვანი ნაწილი ემთხვევა სხვა გუნდის კოდს
- თუ html ფაილში შეცვილი იყო ტესტების კოდის ნაწილი (რომელიც შესაბამისად იყო მონიშნული), ის ფაილი საერთოდ არ ჩაითვლება.
- დავალება არ ჩაითვლება ან ქულა დააკლდება ტესტის არასამართლიანად ჩათვლის სხვა ნებისმიერ მცდელობებზეც. წინა ორი უბრალოდ მაგალითია.

კოდის ამაზე შემოწმებას დიდი დრო დაჭირდება, მომავალი კვირების განმავლობაში გადავხედავთ ყველა პროექტს. რომელიმეს პოვნის შემთხვევაში ქულის განულების ან დაკლების შესახებ მეილს მიიღებთ გამოცდის შემდეგ რამდენიმე კვირაში. 

ასევე, სამწუხაროდ ფიზიკურად აღარ მაქვს დრო, რომ მეტი შეღავათები გაგიკეთოთ ისეთი შეცდომების გამო, რომელიც არ მოხდებოდა გამოგზავნისას ფაილების შემოწმების და ინსტრუქციის წაკითხვის შემთხვევაში. ამ საკითხზე დისკუსიას და ახსნას აღარ ვაპირებ. მომწერეთ მხოლოდ მაშინ, თუ თვლით, რომ შეფასება არასწორია გამსწორებელი პროგრამის შეცდომის გამო (რაც 250 სტუდენტში მოსალოდნელია და ნუ ანერვიულდებით).

ქულების სტატისტიკიდან გამომდინარე, კურსის დიდმა ნაწილმა თავი კარგად გაართვა და იმედი მაქვს უმეტესმა გუნდებმა დამოუკიდებლად იმუშავეთ და საინტერესოდ გაატარეთ დრო :) არ მოგერიდოთ შენიშვნების, რეკომენდაციების, იდეების ან უბრალოდ მოსაზრების გაზიარება <3

ია

${fileInfo(s)}
პროექტის ქულები დეტალურად:

${getProjectScoreSummary(s)}
    `


}


function getProjectScoreSummary(s: Submission) {
    return s.results.filter(e => e.score !== null).map(e => e.message.substr(0, 40) + '...').join('\n')
}

//drag and drop
interface Draggable{
    dragStartHandler(event: DragEvent): void 
    dragEndHandler(event: DragEvent): void
}
interface DragTarget{
    dragOverHandler(event: DragEvent): void
    dragHandler(event: DragEvent): void
    dragLeaveHandler(event: DragEvent): void
}




// project state management
type Listener<T> = (items: T[])=> void

class State <T>{
    protected listeners: Listener<T>[] = []
    addListener(listenerFn: Listener<T>){
        this.listeners.push(listenerFn)
    }
}

class ProjectState extends State<Project>{
    private projects: Project[] = []
    private static instance: ProjectState

    private constructor(){
        super()
    }
    static getInstance(){
        if(!this.instance){
            this.instance = new ProjectState()
        }
        return this.instance
    }

    addProject(title:string, description:string, manday:number){
        const newProject = new Project(Math.random().toString(),title,description,manday,ProjectStatus.Active)
        this.projects.push(newProject)
        for(const listenerFn of this.listeners){
            listenerFn(this.projects.slice())
        }
    }
}

const projectState = ProjectState.getInstance()

//validation
interface Validatable{
    value: string|number
    required?: boolean
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
}

function validate(validatableInput: Validatable){
    let isValid = true
    if(validatableInput.required){
        isValid = isValid && validatableInput.value.toString().trim().length !== 0
    }
    if(validatableInput.minLength != null && typeof(validatableInput.value) === 'string'){
        isValid = isValid && validatableInput.value.length >= validatableInput.minLength
    }
    if(validatableInput.maxLength != null && typeof(validatableInput.value) === 'string'){
        isValid = isValid && validatableInput.value.length <= validatableInput.maxLength
    }
    if(validatableInput.min != null && typeof(validatableInput.value === 'number')){
        isValid = isValid && validatableInput.value >= validatableInput.min
    }
    if(validatableInput.max != null && typeof(validatableInput.value === 'number')){
        isValid = isValid && validatableInput.value <= validatableInput.max
    }
    return isValid
}


//autobind decorator
function autobind(_target: any, _methodName:string, descriptor: PropertyDescriptor){
    const originalMethod = descriptor.value
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        get(){
            const boundFn = originalMethod.bind(this)
            return boundFn
        }
    }
    return adjDescriptor
}

enum ProjectStatus{
    Active, Finished
}

class Project{
    constructor(public id: string, public title:string,public description:string,public manday:number,public status:ProjectStatus){

    }
}
abstract class Component<T extends HTMLElement,U extends HTMLElement> {  
    templateElement : HTMLTemplateElement
    hostElement : T
    element: U

    constructor(tenplateID: string, hostElementId: string, insertAtStart:boolean, newElementId?: string){

        this.templateElement = document.getElementById(tenplateID)! as HTMLTemplateElement
        this.hostElement = document.getElementById(hostElementId)! as T
        const importedNode = document.importNode(this.templateElement.content,true)
        this.element = importedNode.firstElementChild as U
        if (newElementId){
            this.element.id = newElementId
        }
        this.attach(insertAtStart)
    }

    private attach(insertAtBeginning: boolean){
        let insertPosition:InsertPosition = insertAtBeginning ? 'afterbegin' : 'beforeend'
        this.hostElement.insertAdjacentElement(insertPosition, this.element)
    }
    abstract configure(): void
    abstract renderContent(): void
}

class ProjectItem   extends Component<HTMLLinkElement, HTMLLIElement>
                    implements Draggable{
 
    private project: Project
    constructor(hostId: string, project: Project){
        super('single-project', hostId, false, project.id)
        this.project = project
        this.configure()
        this.renderContent()
    }
    get manday(){
        if(this.project.manday < 20){
            return this.project.manday.toString() + " man/day"
        }else{
            return (this.project.manday / 20).toString() + " man/month"
        }
    }
    @autobind
    dragStartHandler(event: DragEvent): void{
        event.dataTransfer!.setData('text/plain',this.project.id)
        event.dataTransfer!.effectAllowed = 'move'
    }
    @autobind
    dragEndHandler(_: DragEvent): void{
        console.log("drag end")
    }

    configure(): void{
        this.element.addEventListener('dragstart',this.dragStartHandler)
        this.element.addEventListener('dragend',this.dragEndHandler)
    }
    renderContent(): void {
        this.element.querySelector("h2")!.textContent = this.project.title
        this.element.querySelector("h3")!.textContent = this.manday
        this.element.querySelector("p")!.textContent = this.project.description
    }
}

class ProjectList extends Component<HTMLDivElement,HTMLElement>
                  implements DragTarget{
    assignedProjects: Project[]

    constructor(private type: 'active'|'finished'){
        super("project-list","app",false,`${type}-projects`)
        this.assignedProjects = []
        this.configure()
        this.renderContent()
    }
    @autobind
    dragOverHandler(event: DragEvent){
        if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain'){
            event.preventDefault()
            const listEl = this.element.querySelector('ul')!
            listEl.classList.add('droppable')
        }
    }

    @autobind
    dragHandler(event: DragEvent){
        console.log(event.dataTransfer!.getData('text/plain'))
    }

    @autobind
    dragLeaveHandler(_: DragEvent){
        const listEl = this.element.querySelector('ul')!
        listEl.classList.remove('droppable')
    }

    renderContent(){
        const listId = `${this.type}-projects-list`
        this.element.querySelector('ul')!.id = listId
        this.element.querySelector('h2')!.textContent = this.type
    }

    configure(): void {
        this.element.addEventListener('dragover', this.dragOverHandler)
        this.element.addEventListener('drop', this.dragHandler)
        this.element.addEventListener('dragleave', this.dragLeaveHandler)


        projectState.addListener((projects: Project[])=>{
            const relevantProjects = projects.filter(prj=>{
                if(this.type === "active"){
                    return prj.status === ProjectStatus.Active
                }
                return prj.status === ProjectStatus.Finished
            })
            this.assignedProjects = relevantProjects
            this.renderProjects()
        })
    }


    private renderProjects(){
        const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement
        listEl.innerHTML = ""
        for(const prjItem of this.assignedProjects){
            new ProjectItem(listEl.id, prjItem)
        }
    }
}


class ProjectInput extends Component<HTMLDivElement,HTMLFormElement>{
    titleInputElement: HTMLInputElement
    descriptionInputElement: HTMLInputElement
    mandayInputElement: HTMLInputElement

    constructor(){
        super("project-input","app", true,'user-input')

        this.titleInputElement = this.element.querySelector('#title')! as HTMLInputElement
        this.descriptionInputElement = this.element.querySelector('#description')! as HTMLInputElement
        this.mandayInputElement = this.element.querySelector('#manday')! as HTMLInputElement

        this.configure()
    }   

    configure(){
        this.element.addEventListener('submit',this.submitHandler)
    }
    renderContent(): void {
        
    }
    private gatherUserInput():[string,string,number]|void{
        const title = this.titleInputElement.value
        const description  = this.descriptionInputElement.value
        const manday = this.mandayInputElement.value

        const titleValidatable: Validatable = {
            value: title,
            required: true
        } 
        const descriptionValidatable: Validatable = {
            value: description,
            required: true,
            minLength: 5
        } 
        const mandayValidatable: Validatable = {
            value: +manday,
            required: true,
            min: 1,
            max: 1000
        } 

        if(!validate(titleValidatable) || 
            !validate(descriptionValidatable) || 
            !validate(mandayValidatable)){
            alert("invalid input!")
        }else{
            return [title,description,+manday]
        }
    }

    private clearInput(){
        this.titleInputElement.value = ""
        this.descriptionInputElement.value = ""
        this.mandayInputElement.value = ""
    }

    @autobind
    private submitHandler(event: Event){
        event.preventDefault()
        const userInput = this.gatherUserInput()
        if (Array.isArray(userInput)){
            const [title,desc,manday] = userInput
            projectState.addProject(title,desc,manday)
            //console.log(title,desc,manday)
            this.clearInput()
        }
    }
}


const projInput = new ProjectInput()
const activePrjList = new ProjectList('active')
const finishedPrjList = new ProjectList('finished')
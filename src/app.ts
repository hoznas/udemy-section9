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

class ProjectInput{
    templateElement : HTMLTemplateElement
    hostElement : HTMLDivElement
    element: HTMLFormElement
    titleInputElement: HTMLInputElement
    descriptionInputElement: HTMLInputElement
    mandayInputElement: HTMLInputElement

    constructor(){
        this.templateElement = document.getElementById("project-input")! as HTMLTemplateElement
        this.hostElement = document.getElementById("app")! as HTMLDivElement

        const importedNode = document.importNode(this.templateElement.content,true)
        this.element = importedNode.firstElementChild as HTMLFormElement
        this.element.id = 'user-input'

        this.titleInputElement = this.element.querySelector('#title')! as HTMLInputElement
        this.descriptionInputElement = this.element.querySelector('#description')! as HTMLInputElement
        this.mandayInputElement = this.element.querySelector('#manday')! as HTMLInputElement

        this.configure()
        this.attach()
    }   

    private validation(str: string): boolean{
        return str.trim().length != 0
    }

    private gatherUnerInput():[string,string,number]|void{
        const title = this.titleInputElement.value
        const description  = this.descriptionInputElement.value
        const manday = this.mandayInputElement.value
        if(this.validation(title) && this.validation(description) && this.validation(manday)){
            return [title,description,+manday]
        }else{
            alert("invalid input!")
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
        const userInput = this.gatherUnerInput()
        if (Array.isArray(userInput)){
            const [title,desc,manday] = userInput
            console.log(title,desc,manday)
            this.clearInput()
        }
    }

    private configure(){
        this.element.addEventListener('submit',this.submitHandler)
    }

    private attach(){
        this.hostElement.insertAdjacentElement('afterbegin', this.element)
    }
}


const projInput = new ProjectInput()

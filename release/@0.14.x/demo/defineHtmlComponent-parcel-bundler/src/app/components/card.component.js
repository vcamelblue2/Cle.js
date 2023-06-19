// PURE CLE
export const Card = (...content)=>(

  { div: {

    class: $ => css`
      background-color: white;
      padding: 25px; 
      border-radius: 10px; 
    `,

    '=>': [
      ...content
    ]

}})
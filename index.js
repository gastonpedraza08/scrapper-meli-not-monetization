const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { getCondition } = require('./helpers/helpers');



(async () => {
	
	//const browser = await puppeteer.launch({ headless: false }); //muestra como se ejecuta
	const browser = await puppeteer.launch(); //se ejecuta por detras


	const page = await browser.newPage();

	await page.setDefaultNavigationTimeout(0);


	let base = 51;

	//arranca en 3 https://celulares.mercadolibre.com.ar/_Desde_101_NoIndex_True
	let helper = 0;
	//base += (helper-1) * 50;
	for(let k=helper; k<40; k++) {



	let linkVisited = '';

	if (k===0) {
		await page.goto('https://celulares.mercadolibre.com.ar/#menu=categories', { waitUntil: 'load', timeout: 0 });
	} else {
		linkVisited = `https://celulares.mercadolibre.com.ar/_Desde_${base}_NoIndex_True`;
		await page.goto(linkVisited, { waitUntil: 'load', timeout: 0 });
		base += 50;
	}
	//
	//https://celulares.mercadolibre.com.ar/_Desde_101_NoIndex_True
	//https://celulares.mercadolibre.com.ar/_Desde_151_NoIndex_True

	await page.waitForSelector('.ui-search-layout__item');


	let list = await page.evaluate(async () => {

		const heightBody = document.querySelector('body').scrollHeight;
		for (let i=0; i< heightBody; i+=10) {
			window.scrollTo(0, i);
			await new Promise(res => {
				setTimeout(() => {
					res();
				}, 300);
			});
		}

		await new Promise(res => {
			setTimeout(() => {
				res();
			}, 10000);
		});

		const myList = document.querySelectorAll('.ui-search-layout__item');

		const list = [];

		for(let i=0; i<myList.length; i++) {
			let link = myList[i].querySelector('.ui-search-result__wrapper .andes-card .ui-search-result__content-wrapper .ui-search-item__group a').href;
			let thumbnail = myList[i].querySelector('img.ui-search-result-image__element').src;

			list.push({
				link,
				thumbnail
			});
		}

		return list;
	});

	let jsonToWrite = {
		myArray: []
	};


	//recorremos cada link
	for(let i=0; i<list.length; i++) {
		//linea temporal para que no demore mucho
		console.log(i)
		//if (i!==0) continue;
		

		await page.goto(list[i].link, { waitUntil: 'load', timeout: 0 });


		/*
			ACA YA GENERAMOS EL CUERPO DEL PRODUCTO
		*/
		try {
			await page.waitForSelector('.ui-vpp-highlighted-specs__striped-specs .ui-vpp-striped-specs__table');

			let product = await page.evaluate(() => {
				const containers = document.querySelectorAll('.ui-vpp-highlighted-specs__striped-specs .ui-vpp-striped-specs__table');
				
				let infoHelper = {};
				for(let i=0; i<containers.length; i++) {
					let containerName = containers[i].querySelector('h3')?.innerText.toLocaleLowerCase().replaceAll(' ', '_');

					if(!infoHelper.hasOwnProperty(containerName)) {
						infoHelper[containerName] = {};
					};

					const raws = containers[i].querySelectorAll('table tbody tr');
					for(let j=0; j<raws.length; j++) {
						const propName = raws[j].querySelector('th')?.innerText.toLocaleLowerCase().replaceAll(' ', '_');
						let propValue = raws[j].querySelector('td')?.innerText;

						//aca customizamos algunas props
						switch(propName) {
							case "tamaño_de_la_pantalla": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
							case "píxeles_por_pulgada_de_la_pantalla": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
							case "capacidad_de_la_batería": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
							case "tiempo_de_conversación": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
							case "cantidad_de_núcleos_del_procesador": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
							case "velocidad_del_procesador": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
							case "cantidad_de_ranuras_para_tarjeta_sim": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
							case "memoria_interna": {
								let type = propValue.match(/[a-zA-Z]+/g)[0];
								if (type==='TB') {
									propValue = Number(propValue.match(/[0-9.]+/g))*1000;
								} else if (type==='GB') {
									propValue = Number(propValue.match(/[0-9.]+/g));
								} else {
									//mb
									propValue = Number(propValue.match(/[0-9.]+/g))/1000;
								}
								break;
							}
							case "memoria_ram": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
							case "capacidad_máxima_de_la_tarjeta_de_memoria": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
							case "resolución_de_la_cámara_trasera_principal": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
							case "resolución_de_la_cámara_frontal_principal": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
							case "cantidad_de_cámaras_traseras": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
							case "cantidad_de_cámaras_frontales": {
								propValue = Number(propValue.match(/[0-9.]+/g));
								break;
							}
						}

						infoHelper[containerName][propName] = propValue;
					};
				}


				//RETURN PRODUCT


				//condition
				let condition;
				(() => {
					let conditionElement = document.querySelector('.andes-badge.andes-badge--pill.andes-badge--generic .andes-badge__content');

					if (conditionElement) {
						condition = conditionElement?.innerText;
					} else {
						condition = document.querySelector('.ui-pdp-header__subtitle .ui-pdp-subtitle')?.innerText.match(/\w+/gi)[0];
					}
				})();
				
				//description
				let description = '';
				let parrafoArr = document.querySelector('p.ui-pdp-description__content')?.innerText.split(/\n/gi);
				parrafoArr.forEach(parrafo => {
					if(parrafo === '') {
						description += '<br>'
					} else {
						description += '<p>' + parrafo + '</p>';
					}
				});

				//images
				let images;
				//let imagesArr = document.querySelectorAll('.ui-pdp-gallery__column span.ui-pdp-gallery__wrapper .ui-pdp-thumbnail__picture img.ui-pdp-image');
				let imagesArr = document.querySelectorAll('.ui-pdp-image.ui-pdp-gallery__figure__image');
				let arrIma = [];
				for (let i=0; i<imagesArr.length; i++) {
					arrIma.push(imagesArr[i].src);
				}
				images = arrIma.join(';');

				//stock
				let stock = document.querySelector('.ui-pdp-buybox__quantity .ui-pdp-buybox__quantity__available')
					?.innerText.match(/\d+/)[0];


				return {
					name: document.querySelector('.ui-pdp-header__title-container h1')?.innerText,
					price: Number(document.querySelector('.price-tag-amount .price-tag-fraction')?.innerText),
					condition: condition ? condition : 'Nuevo',
					description: description ? description : '<p>Este producto no posee descripción.</p>',
					images,
					categoryId: 1,
					stock: stock ? Number(stock) : 1,
					state: 'activo',
					createdAt: 'identificador-unico-para-cambiar',
					updatedAt: 'identificador-unico-para-cambiar',
					infoHelper,
				}
			});

			product.sku = uuidv4();
			product.thumbnail = list[i].thumbnail;
			product.link = list[i].link;

			jsonToWrite.myArray.push(product);
			console.log(i);
		} catch (e) {
			console.log(e);
			console.log("VOY A CONTINUAR");
		}
	}

	console.log("fin");
	fs.writeFileSync(`./products/product-${k}.js`, JSON.stringify(jsonToWrite, null, 2) , 'utf-8');
	console.log("last link visited: ");
	console.log(linkVisited);
	console.log("valo de la k: " + k);
}
	await browser.close();
})();
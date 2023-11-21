import React, { useState, useEffect, useContext, useRef } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle';
import { Editor } from '@tinymce/tinymce-react';
const ExamCreator = () => {
	const editorRef = useRef(null);
	const log = () => {
		if (editorRef.current) {
			console.log(editorRef.current.getContent());
		}
	};

	// Function to generate an eight-character code consisting of lowercase letters, uppercase letters, and numbers.
	const generateCode = () => {
		let code = '';
		const characters =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 8; i++) {
			code += characters.charAt(Math.floor(Math.random() * characters.length));
		}
		return code;
	};

	const [code, setCode] = useState(generateCode());

	// Generate the code when the component is rendered
	// useEffect(() => {
	// 	const code = generateCode();
	// 	console.log(code);
	// }, []);

	return (
		<div className='mt-4'>
			<div className='d-flex'>
				<div className='col-2'>
					<label htmlFor='exampleFormControlInput1'>Kod egzaminu: </label>
					<input
						className='form-control text-primary'
						style={{ width: 120, height: 38 }}
						maxLength={8}
						value={code}
						onChange={(e) => setCode(e.target.value)}
						type='text'
						placeholder='wprowadź kod testu'
					></input>
				</div>
				<div className='col-4 mt-4'>
					<button
						type='button'
						onClick={() => setCode(generateCode())}
						className='btn btn-success'
					>
						Generuj nowy kod egzaminu
					</button>
				</div>
			</div>
			<div className='d-flex mt-5'>
				<label className='col-3' htmlFor='exampleFormControlInput1'>
					Kwalifikacja zawodowa:{' '}
				</label>
				<select
					className='form-select'
					size={{ width: 200 }}
					aria-label='Kwalifikacja'
				>
					<option selected>Wybierz kwalifikację</option>
					<option value='1'>INF.02</option>
					<option value='2'>INF.03</option>
					<option value='3'>INF.04</option>
				</select>
			</div>

			<div className='mt-4'>
				<div className='pb-3 h4'>Pytanie 1</div>
				{
					<Editor
						apiKey='gv5fnyynnu54nbfl7gqe2noc7l3i4w7uq8ra8c9iglkcz2lh'
						onInit={(evt, editor) => (editorRef.current = editor)}
						initialValue='<p>Tu twórz pytanie.</p>'
						init={{
							selector: 'textarea',
							toolbar: 'language',
							language: 'pl',
							content_langs: [{ title: 'Polish', code: 'pl' }],
							height: 400,
							menubar: false,
							plugins: [
								'advlist',
								'autolink',
								'lists',
								'link',
								'image',
								'charmap',
								'preview',
								'anchor',
								'searchreplace',
								'visualblocks',
								'code',
								'fullscreen',
								'insertdatetime',
								'media',
								'table',
								'code',
								'help',
								'wordcount',
								'codesample',
								'hilitecolor',
							],
							toolbar:
								'undo redo blocks | media image link codesample | ' +
								'bold italic forecolor backcolor | alignleft aligncenter ' +
								'alignright alignjustify | bullist numlist outdent indent | ' +
								'removeformat | help',
							content_style:
								'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
						}}
					/>
				}
				<div className='mt-4'>
					<strong className='h4'>Odpowiedzi</strong>
					<div className='d-flex mt-3'>
						<div className='col-1 d-flex justify-content-center'>
							<input
								type='radio'
								className='form-check-input'
								name='answer'
								value='a'
							/>
							&nbsp;
							<strong> A. </strong>
						</div>
						<div className='col-10'>
							{
								<Editor
									apiKey='gv5fnyynnu54nbfl7gqe2noc7l3i4w7uq8ra8c9iglkcz2lh'
									onInit={(evt, editor) => (editorRef.current = editor)}
									initialValue='<p></p>'
									init={{
										selector: 'textarea',
										toolbar: 'language',
										language: 'pl',
										content_langs: [{ title: 'Polish', code: 'pl' }],
										height: 200,
										width: 850,
										menubar: false,
										plugins: [
											'advlist',
											'autolink',
											'lists',
											'link',
											'image',
											'charmap',
											'preview',
											'anchor',
											'searchreplace',
											'visualblocks',
											'code',
											'fullscreen',
											'insertdatetime',
											'media',
											'table',
											'code',
											'help',
											'wordcount',
											'codesample',
											'hilitecolor',
										],
										toolbar:
											'undo redo blocks | media image link codesample | ' +
											'bold italic forecolor backcolor | alignleft aligncenter ' +
											'alignright alignjustify | bullist numlist outdent indent | ' +
											'removeformat | help',
										content_style:
											'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
									}}
								/>
							}
						</div>
					</div>
					<div className='d-flex mt-4'>
						<div className='col-1 d-flex justify-content-center'>
							<input
								type='radio'
								className='form-check-input'
								name='answer'
								value='b'
							/>
							&nbsp;
							<strong> B. </strong>
						</div>
						<div className='col-10'>
							{
								<Editor
									apiKey='gv5fnyynnu54nbfl7gqe2noc7l3i4w7uq8ra8c9iglkcz2lh'
									onInit={(evt, editor) => (editorRef.current = editor)}
									initialValue='<p></p>'
									init={{
										selector: 'textarea',
										toolbar: 'language',
										language: 'pl',
										content_langs: [{ title: 'Polish', code: 'pl' }],
										height: 200,
										width: 850,
										menubar: false,
										plugins: [
											'advlist',
											'autolink',
											'lists',
											'link',
											'image',
											'charmap',
											'preview',
											'anchor',
											'searchreplace',
											'visualblocks',
											'code',
											'fullscreen',
											'insertdatetime',
											'media',
											'table',
											'code',
											'help',
											'wordcount',
											'codesample',
											'hilitecolor',
										],
										toolbar:
											'undo redo blocks | media image link codesample | ' +
											'bold italic forecolor backcolor | alignleft aligncenter ' +
											'alignright alignjustify | bullist numlist outdent indent | ' +
											'removeformat | help',
										content_style:
											'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
									}}
								/>
							}
						</div>
					</div>
					<div className='d-flex mt-4'>
						<div className='col-1 d-flex justify-content-center'>
							<input
								type='radio'
								className='form-check-input'
								name='answer'
								value='c'
							/>
							&nbsp;
							<strong> C. </strong>
						</div>
						<div className='col-10'>
							{
								<Editor
									apiKey='gv5fnyynnu54nbfl7gqe2noc7l3i4w7uq8ra8c9iglkcz2lh'
									onInit={(evt, editor) => (editorRef.current = editor)}
									initialValue='<p></p>'
									init={{
										selector: 'textarea',
										toolbar: 'language',
										language: 'pl',
										content_langs: [{ title: 'Polish', code: 'pl' }],
										height: 200,
										width: 850,
										menubar: false,
										plugins: [
											'advlist',
											'autolink',
											'lists',
											'link',
											'image',
											'charmap',
											'preview',
											'anchor',
											'searchreplace',
											'visualblocks',
											'code',
											'fullscreen',
											'insertdatetime',
											'media',
											'table',
											'code',
											'help',
											'wordcount',
											'codesample',
											'hilitecolor',
										],
										toolbar:
											'undo redo blocks | media image link codesample | ' +
											'bold italic forecolor backcolor | alignleft aligncenter ' +
											'alignright alignjustify | bullist numlist outdent indent | ' +
											'removeformat | help',
										content_style:
											'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
									}}
								/>
							}
						</div>
					</div>
					<div className='d-flex mt-4'>
						<div className='col-1 d-flex justify-content-center'>
							<input
								type='radio'
								className='form-check-input'
								name='answer'
								value='d'
							/>
							&nbsp;
							<strong> D. </strong>
						</div>
						<div className='col-10'>
							{
								<Editor
									apiKey='gv5fnyynnu54nbfl7gqe2noc7l3i4w7uq8ra8c9iglkcz2lh'
									onInit={(evt, editor) => (editorRef.current = editor)}
									initialValue='<p></p>'
									init={{
										selector: 'textarea',
										toolbar: 'language',
										language: 'pl',
										content_langs: [{ title: 'Polish', code: 'pl' }],
										height: 200,
										width: 850,
										menubar: false,
										plugins: [
											'advlist',
											'autolink',
											'lists',
											'link',
											'image',
											'charmap',
											'preview',
											'anchor',
											'searchreplace',
											'visualblocks',
											'code',
											'fullscreen',
											'insertdatetime',
											'media',
											'table',
											'code',
											'help',
											'wordcount',
											'codesample',
											'hilitecolor',
										],
										toolbar:
											'undo redo blocks | media image link codesample | ' +
											'bold italic forecolor backcolor | alignleft aligncenter ' +
											'alignright alignjustify | bullist numlist outdent indent | ' +
											'removeformat | help',
										content_style:
											'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
									}}
								/>
							}
						</div>
					</div>
					<div className='d-flex justify-content-end'>
						<button type='submit' className='mt-4 btn btn-primary'>
							Zapisz
						</button>
					</div>
				</div>
				<div style={{ height: 50 }}></div>
			</div>
		</div>
	);
};

export default ExamCreator;
